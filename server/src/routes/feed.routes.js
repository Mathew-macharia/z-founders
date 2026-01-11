const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * Build visibility filter based on user type
 */
const getVisibilityFilter = (user) => {
    if (!user) {
        return [{ visibility: 'PUBLIC' }];
    }

    const filters = [{ visibility: 'PUBLIC' }];

    if (user.accountType === 'INVESTOR') {
        // Investors can see public and investors-only, but NOT community
        filters.push({ visibility: 'INVESTORS_ONLY' });
    } else if (['FOUNDER', 'BUILDER'].includes(user.accountType)) {
        // Founders and builders can see community, not investors-only
        filters.push({ visibility: 'COMMUNITY' });
    }

    return filters;
};

/**
 * GET /api/feed/home
 * Personalized home feed
 */
router.get('/home', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    // Get following IDs
    const following = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    // Get user interests from feed preferences
    const preferences = await prisma.feedPreference.findUnique({
        where: { userId: req.user.id }
    });

    const videos = await prisma.video.findMany({
        where: {
            OR: [
                // Videos from followed users
                { userId: { in: followingIds } },
                // Videos matching interests (by tags)
                ...(preferences?.industries?.length ? [{
                    tags: { hasSome: preferences.industries }
                }] : []),
                // Recent videos from all users (last 7 days)
                { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
            ],
            AND: {
                OR: getVisibilityFilter(req.user)
            }
        },
        include: {
            user: {
                include: {
                    profile: true,
                    founderProfile: true
                }
            },
            _count: {
                select: { likes: true, comments: true }
            }
        },
        orderBy: [
            { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    // Add engagement status
    const videoIds = videos.map(v => v.id);
    const userLikes = await prisma.like.findMany({
        where: { userId: req.user.id, videoId: { in: videoIds } }
    });
    const userSaves = await prisma.save.findMany({
        where: { userId: req.user.id, videoId: { in: videoIds } }
    });

    const likedIds = new Set(userLikes.map(l => l.videoId));
    const savedIds = new Set(userSaves.map(s => s.videoId));

    const enrichedVideos = videos.map(v => ({
        ...v,
        isLiked: likedIds.has(v.id),
        isSaved: savedIds.has(v.id),
        isFollowing: followingIds.includes(v.userId)
    }));

    res.json({
        videos: enrichedVideos,
        page: parseInt(page),
        hasMore: videos.length === parseInt(limit)
    });
}));

/**
 * GET /api/feed/pitches
 * Browse all pitch videos with filters
 */
router.get('/pitches', optionalAuth, asyncHandler(async (req, res) => {
    const {
        page = 1,
        limit = 20,
        industry,
        stage,
        lookingFor,
        location,
        minViews,
        hasDemo
    } = req.query;

    const where = {
        type: 'PITCH',
        OR: getVisibilityFilter(req.user)
    };

    // Apply filters
    if (industry) {
        where.tags = { has: industry };
    }

    if (minViews) {
        where.viewCount = { gte: parseInt(minViews) };
    }

    // Stage and looking-for filters need founder profile join
    let founderProfileFilter = {};
    if (stage || lookingFor) {
        founderProfileFilter = {
            user: {
                founderProfile: {
                    ...(lookingFor === 'funding' && { lookingForFunding: true }),
                    ...(lookingFor === 'cofounder' && { lookingForCofounder: true }),
                    ...(lookingFor === 'feedback' && { lookingForFeedback: true }),
                    ...(stage && {
                        fundraisingDetails: { stage }
                    })
                }
            }
        };
    }

    if (location) {
        where.user = {
            ...where.user,
            profile: { location: { contains: location, mode: 'insensitive' } }
        };
    }

    const videos = await prisma.video.findMany({
        where: { ...where, ...founderProfileFilter },
        include: {
            user: {
                include: {
                    profile: true,
                    founderProfile: {
                        include: { fundraisingDetails: true }
                    }
                }
            },
            _count: {
                select: { likes: true, comments: true, saves: true }
            }
        },
        orderBy: [
            { viewCount: 'desc' },
            { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    res.json({
        videos,
        page: parseInt(page),
        hasMore: videos.length === parseInt(limit)
    });
}));

/**
 * GET /api/feed/following
 * Chronological feed from followed users
 */
router.get('/following', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const following = await prisma.follow.findMany({
        where: { followerId: req.user.id },
        select: { followingId: true }
    });
    const followingIds = following.map(f => f.followingId);

    if (followingIds.length === 0) {
        return res.json({ videos: [], page: 1, hasMore: false });
    }

    const videos = await prisma.video.findMany({
        where: {
            userId: { in: followingIds },
            OR: getVisibilityFilter(req.user)
        },
        include: {
            user: {
                include: { profile: true }
            },
            _count: {
                select: { likes: true, comments: true }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    res.json({
        videos,
        page: parseInt(page),
        hasMore: videos.length === parseInt(limit)
    });
}));

/**
 * GET /api/feed/trending
 * Trending content from last 24h/7d
 */
router.get('/trending', optionalAuth, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, period = '24h' } = req.query;

    const periodMap = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000
    };

    const since = new Date(Date.now() - (periodMap[period] || periodMap['24h']));

    const videos = await prisma.video.findMany({
        where: {
            createdAt: { gte: since },
            OR: getVisibilityFilter(req.user)
        },
        include: {
            user: {
                include: { profile: true }
            },
            _count: {
                select: { likes: true, comments: true, shares: true }
            }
        },
        orderBy: [
            { likeCount: 'desc' },
            { viewCount: 'desc' },
            { commentCount: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    res.json({
        videos,
        page: parseInt(page),
        period,
        hasMore: videos.length === parseInt(limit)
    });
}));

/**
 * GET /api/feed/for-you
 * AI-curated feed for investors based on thesis and engagement
 */
router.get('/for-you', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    if (req.user.accountType !== 'INVESTOR') {
        return res.status(403).json({ error: 'For You feed is only available for investors' });
    }

    // Get investor profile for matching
    const investorProfile = await prisma.investorProfile.findUnique({
        where: { userId: req.user.id }
    });

    // Get past engagement for learning
    const savedVideos = await prisma.save.findMany({
        where: { userId: req.user.id },
        include: { video: { select: { tags: true } } }
    });

    // Build interest profile from saves
    const engagedTags = savedVideos.flatMap(s => s.video.tags);
    const tagFrequency = engagedTags.reduce((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
    }, {});
    const topTags = Object.entries(tagFrequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([tag]) => tag);

    // Get videos matching investor interests
    const videos = await prisma.video.findMany({
        where: {
            type: 'PITCH',
            isPinned: true,
            OR: [
                // Match investor's stated industries
                ...(investorProfile?.industries?.length ? [{
                    tags: { hasSome: investorProfile.industries }
                }] : []),
                // Match engaged tags
                ...(topTags.length ? [{
                    tags: { hasSome: topTags }
                }] : []),
                // High traction videos
                { viewCount: { gte: 50 } }
            ],
            AND: {
                visibility: { in: ['PUBLIC', 'INVESTORS_ONLY'] }
            },
            // Exclude already viewed
            NOT: {
                views: {
                    some: { viewerId: req.user.id }
                }
            }
        },
        include: {
            user: {
                include: {
                    profile: true,
                    founderProfile: {
                        include: { fundraisingDetails: true }
                    }
                }
            },
            analytics: true,
            _count: {
                select: { likes: true, comments: true, saves: true }
            }
        },
        orderBy: [
            { viewCount: 'desc' },
            { createdAt: 'desc' }
        ],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    res.json({
        videos,
        page: parseInt(page),
        hasMore: videos.length === parseInt(limit),
        matchedOn: {
            thesisIndustries: investorProfile?.industries || [],
            engagementTags: topTags
        }
    });
}));

module.exports = router;
