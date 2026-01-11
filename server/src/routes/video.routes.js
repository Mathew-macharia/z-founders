const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, optionalAuth, requireAccountType, checkVideoVisibility, requirePremium } = require('../middleware/auth.middleware');
const socketService = require('../services/socket.service');

const router = express.Router();

// Video type permissions
const VIDEO_TYPE_PERMISSIONS = {
    PITCH: ['FOUNDER'],
    UPDATE: ['FOUNDER', 'BUILDER', 'INVESTOR'],
    ASK: ['FOUNDER', 'BUILDER', 'INVESTOR'],
    WIN_LOSS: ['FOUNDER', 'BUILDER', 'INVESTOR']
};

/**
 * POST /api/videos
 * Upload a new video
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const {
        videoUrl,
        thumbnailUrl,
        type = 'UPDATE',
        visibility = 'PUBLIC',
        caption,
        duration,
        tags = [],
        isPinned = false
    } = req.body;

    // Check type permission
    if (!VIDEO_TYPE_PERMISSIONS[type]?.includes(req.user.accountType)) {
        return res.status(403).json({
            error: `${type} videos can only be posted by: ${VIDEO_TYPE_PERMISSIONS[type]?.join(', ')}`
        });
    }

    // Check video duration
    const maxDuration = parseInt(process.env.MAX_VIDEO_DURATION_SECONDS) || 90;
    if (duration > maxDuration) {
        return res.status(400).json({ error: `Video exceeds maximum duration of ${maxDuration} seconds` });
    }

    // Check daily post limit
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayPosts = await prisma.video.count({
        where: {
            userId: req.user.id,
            createdAt: { gte: today }
        }
    });

    const isPremium = ['FOUNDER_PRO', 'INVESTOR_PRO', 'STEALTH_MODE'].includes(req.user.subscription?.tier);
    const dailyLimit = isPremium
        ? parseInt(process.env.PREMIUM_DAILY_POST_LIMIT) || 10
        : parseInt(process.env.FREE_DAILY_POST_LIMIT) || 3;

    if (todayPosts >= dailyLimit) {
        return res.status(429).json({
            error: `Daily post limit of ${dailyLimit} reached`,
            upgradeUrl: isPremium ? null : '/api/subscriptions/plans'
        });
    }

    // Investors-only visibility requires premium
    if (visibility === 'INVESTORS_ONLY' && !isPremium) {
        return res.status(403).json({
            error: 'Investors-only visibility requires premium subscription'
        });
    }

    // Handle pinned pitch - only one allowed
    if (isPinned && type === 'PITCH') {
        await prisma.video.updateMany({
            where: {
                userId: req.user.id,
                isPinned: true
            },
            data: { isPinned: false }
        });
    }

    const video = await prisma.video.create({
        data: {
            userId: req.user.id,
            videoUrl,
            thumbnailUrl,
            type,
            visibility,
            caption,
            duration,
            tags,
            isPinned: type === 'PITCH' ? isPinned : false,
            analytics: {
                create: {}
            }
        },
        include: {
            user: {
                include: { profile: true }
            },
            analytics: true
        }
    });

    res.status(201).json({ video });
}));

/**
 * GET /api/videos/saved
 * Get saved videos
 */
router.get('/saved', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 20 } = req.query;

    const saved = await prisma.save.findMany({
        where: { userId: req.user.id },
        include: {
            video: {
                include: {
                    user: { include: { profile: true } },
                    _count: {
                        select: {
                            likes: true,
                            comments: true,
                            saves: true,
                            shares: true
                        }
                    }
                }
            }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    const videos = saved.map(s => s.video);

    // Check which are liked/saved by user (obviously saved is true)
    // We can just add the flags
    const formatted = await Promise.all(videos.map(async (video) => {
        const isLiked = !!(await prisma.like.findUnique({
            where: { videoId_userId: { videoId: video.id, userId: req.user.id } }
        }));

        return {
            ...video,
            isLiked,
            isSaved: true, // It's in the saved list
            isFollowing: false // Can optimize this later
        };
    }));

    res.json({ videos: formatted });
}));

/**
 * GET /api/videos/:id
 * Get video by ID
 */
router.get('/:id', optionalAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
        where: { id },
        include: {
            user: {
                include: {
                    profile: true,
                    founderProfile: true
                }
            },
            analytics: true,
            _count: {
                select: {
                    likes: true,
                    comments: true,
                    saves: true,
                    shares: true
                }
            }
        }
    });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    // Check visibility
    if (video.visibility !== 'PUBLIC' && !req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (video.visibility === 'COMMUNITY' &&
        req.user?.accountType === 'INVESTOR' &&
        video.userId !== req.user.id) {
        return res.status(403).json({ error: 'Community-only content' });
    }

    if (video.visibility === 'INVESTORS_ONLY' &&
        req.user?.accountType !== 'INVESTOR' &&
        video.userId !== req.user?.id) {
        return res.status(403).json({ error: 'Investor-only content' });
    }

    // Track view
    if (req.user && req.user.id !== video.userId) {
        await prisma.videoView.upsert({
            where: {
                videoId_viewerId: {
                    videoId: id,
                    viewerId: req.user.id
                }
            },
            create: {
                videoId: id,
                viewerId: req.user.id,
                watchTime: 0
            },
            update: {}
        });

        // Update analytics
        await prisma.video.update({
            where: { id },
            data: { viewCount: { increment: 1 } }
        });

        // Real-time View Update (Throttled/Owner-only)
        socketService.emitNotification(video.userId, {
            type: 'view_update',
            data: { videoId: id, viewCount: video.viewCount + 1 }
        });
    }

    // Check if user liked/saved
    let isLiked = false;
    let isSaved = false;
    let isFollowing = false;

    if (req.user) {
        isLiked = !!(await prisma.like.findUnique({
            where: { videoId_userId: { videoId: id, userId: req.user.id } }
        }));

        isSaved = !!(await prisma.save.findFirst({
            where: { videoId: id, userId: req.user.id }
        }));

        isFollowing = !!(await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: video.userId
                }
            }
        }));
    }

    res.json({
        video,
        isLiked,
        isSaved,
        isFollowing,
        isOwner: req.user?.id === video.userId
    });
}));

/**
 * PATCH /api/videos/:id
 * Update video
 */
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { visibility, caption, tags, isPinned } = req.body;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot update others videos' });
    }

    // Handle pinning
    if (isPinned === true && video.type === 'PITCH') {
        await prisma.video.updateMany({
            where: {
                userId: req.user.id,
                isPinned: true,
                id: { not: id }
            },
            data: { isPinned: false }
        });
    }

    const updated = await prisma.video.update({
        where: { id },
        data: {
            ...(visibility && { visibility }),
            ...(caption !== undefined && { caption }),
            ...(tags && { tags }),
            ...(isPinned !== undefined && video.type === 'PITCH' && { isPinned })
        },
        include: {
            user: { include: { profile: true } }
        }
    });

    res.json({ video: updated });
}));

/**
 * DELETE /api/videos/:id
 * Delete video
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== req.user.id) {
        return res.status(403).json({ error: 'Cannot delete others videos' });
    }

    await prisma.video.delete({ where: { id } });

    res.json({ message: 'Video deleted' });
}));

/**
 * POST /api/videos/:id/pin
 * Pin video as main pitch
 */
router.post('/:id/pin', authenticate, requireAccountType('FOUNDER'), asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video || video.userId !== req.user.id) {
        return res.status(404).json({ error: 'Video not found' });
    }

    if (video.type !== 'PITCH') {
        return res.status(400).json({ error: 'Only pitch videos can be pinned' });
    }

    // Unpin all others
    await prisma.video.updateMany({
        where: { userId: req.user.id, isPinned: true },
        data: { isPinned: false }
    });

    const updated = await prisma.video.update({
        where: { id },
        data: { isPinned: true }
    });

    res.json({ video: updated });
}));

/**
 * POST /api/videos/:id/like
 * Like a video
 */
router.post('/:id/like', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    // CRITICAL: Block permissions
    if (req.user.accountType === 'LURKER') {
        return res.status(403).json({ error: 'Lurkers cannot like videos. Please upgrade.' });
    }
    if (req.user.accountType === 'INVESTOR') {
        const verification = await prisma.investorVerification.findUnique({ where: { userId: req.user.id } });
        if (verification?.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Verify your profile to like videos.' });
        }
    }

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    await prisma.like.upsert({
        where: { videoId_userId: { videoId: id, userId: req.user.id } },
        create: { videoId: id, userId: req.user.id },
        update: {}
    });

    await prisma.video.update({
        where: { id },
        data: { likeCount: { increment: 1 } }
    });

    // Notify video owner
    if (video.userId !== req.user.id) {
        // DB Notification
        await prisma.notification.create({
            data: {
                userId: video.userId,
                type: 'new_like',
                priority: 'LOW',
                title: 'New Like',
                body: `${req.user.email} liked your video`,
                data: { videoId: id }
            }
        });

        // Real-time Notification
        socketService.emitNotification(video.userId, {
            type: 'like',
            message: `${req.user.email} liked your video`,
            data: { videoId: id }
        });
    }

    res.json({ message: 'Liked' });
}));

// ... (unlike handler unchanged) ...

/**
 * POST /api/videos/:id/save
 * Save a video
 */
router.post('/:id/save', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    await prisma.save.upsert({
        where: { videoId_userId: { videoId: id, userId: req.user.id } },
        create: { videoId: id, userId: req.user.id },
        update: {}
    });

    // Notify video owner
    if (video.userId !== req.user.id) {
        // Real-time Notification - No DB notification for saves (low priority)?
        // Let's stick to socket only for now as per plan
        socketService.emitNotification(video.userId, {
            type: 'new_save',
            message: `${req.user.email} saved your video`,
            data: { videoId: id }
        });
    }

    res.json({ message: 'Video saved' });
}));

/**
 * DELETE /api/videos/:id/save
 * Unsave a video
 */
router.delete('/:id/save', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.save.deleteMany({
        where: {
            videoId: id,
            userId: req.user.id
        }
    });

    res.json({ message: 'Video unsaved' });
}));

/**
 * POST /api/videos/:id/comment
 * Add comment
 */
router.post('/:id/comment', authenticate, asyncHandler(async (req, res) => {
    // ... existing code ...
    const { id } = req.params;
    const { content, parentId } = req.body;

    if (!content?.trim()) {
        return res.status(400).json({ error: 'Comment content required' });
    }

    // CRITICAL: Block permissions
    if (req.user.accountType === 'LURKER') {
        return res.status(403).json({ error: 'Lurkers cannot comment. Please upgrade.' });
    }
    if (req.user.accountType === 'INVESTOR') {
        const verification = await prisma.investorVerification.findUnique({ where: { userId: req.user.id } });
        if (verification?.status !== 'APPROVED') {
            return res.status(403).json({ error: 'Verify your profile to comment.' });
        }
    }

    const video = await prisma.video.findUnique({
        where: { id },
        include: { user: true }
    });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    // Check if investor commenting reveals profile
    if (req.user.accountType === 'INVESTOR') {
        const investorProfile = await prisma.investorProfile.findUnique({
            where: { userId: req.user.id }
        });

        if (investorProfile && !investorProfile.isPublicMode) {
            // Create profile reveal for this founder
            await prisma.profileReveal.upsert({
                where: {
                    investorId_founderId: {
                        investorId: req.user.id,
                        founderId: video.userId
                    }
                },
                create: {
                    investorId: req.user.id,
                    founderId: video.userId
                },
                update: {}
            });
        }
    }

    const comment = await prisma.comment.create({
        data: {
            videoId: id,
            userId: req.user.id,
            content: content.trim(),
            parentId
        },
        include: {
            user: { include: { profile: true } }
        }
    });

    await prisma.video.update({
        where: { id },
        data: { commentCount: { increment: 1 } }
    });

    // Notify video owner
    if (video.userId !== req.user.id) {
        // DB Notification
        await prisma.notification.create({
            data: {
                userId: video.userId,
                type: 'new_comment',
                priority: 'MEDIUM',
                title: 'New Comment',
                body: `${req.user.email} commented on your video`,
                data: { videoId: id, commentId: comment.id }
            }
        });

        // Real-time Notification
        socketService.emitNotification(video.userId, {
            type: 'comment',
            message: `${req.user.email} commented on your video`,
            data: { videoId: id, commentId: comment.id }
        });
    }

    res.status(201).json({ comment });
}));

/**
 * GET /api/videos/:id/comments
 * Get video comments
 */
router.get('/:id/comments', optionalAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const comments = await prisma.comment.findMany({
        where: {
            videoId: id,
            parentId: null, // Top-level comments only
            isHidden: false
        },
        include: {
            user: { include: { profile: true } },
            replies: {
                where: { isHidden: false },
                include: {
                    user: { include: { profile: true } }
                },
                take: 3,
                orderBy: { createdAt: 'asc' }
            },
            _count: { select: { replies: true } }
        },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.comment.count({
        where: { videoId: id, parentId: null, isHidden: false }
    });

    res.json({
        comments,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
}));

/**
 * GET /api/videos/:id/analytics
 * Get video analytics (premium feature)
 */
router.get('/:id/analytics', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const video = await prisma.video.findUnique({ where: { id } });

    if (!video || video.userId !== req.user.id) {
        return res.status(404).json({ error: 'Video not found' });
    }

    const isPremium = ['FOUNDER_PRO', 'INVESTOR_PRO', 'STEALTH_MODE'].includes(req.user.subscription?.tier);

    // Basic analytics (free)
    const basicAnalytics = {
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        commentCount: video.commentCount,
        shareCount: video.shareCount
    };

    if (!isPremium) {
        return res.json({
            analytics: basicAnalytics,
            premium: false,
            upgradeUrl: '/api/subscriptions/plans'
        });
    }

    // Premium analytics
    const viewsBreakdown = await prisma.videoView.groupBy({
        by: ['viewerId'],
        where: { videoId: id },
        _sum: { watchTime: true },
        _count: { replays: true }
    });

    // Get viewer details for breakdown
    const viewerIds = viewsBreakdown.map(v => v.viewerId);
    const viewers = await prisma.user.findMany({
        where: { id: { in: viewerIds } },
        select: { id: true, accountType: true }
    });

    const accountTypeBreakdown = {
        founders: viewers.filter(v => v.accountType === 'FOUNDER').length,
        builders: viewers.filter(v => v.accountType === 'BUILDER').length,
        investors: viewers.filter(v => v.accountType === 'INVESTOR').length
    };

    // Get public investor viewers
    const investorViewers = await prisma.user.findMany({
        where: {
            id: { in: viewerIds },
            accountType: 'INVESTOR',
            investorProfile: { isPublicMode: true }
        },
        include: {
            profile: true,
            investorProfile: true
        }
    });

    const analytics = await prisma.videoAnalytics.findUnique({ where: { videoId: id } });

    res.json({
        analytics: {
            ...basicAnalytics,
            ...(analytics || {}),
            accountTypeBreakdown,
            investorViews: accountTypeBreakdown.investors,
            publicInvestorViewers: investorViewers.map(i => ({
                id: i.id,
                firm: i.investorProfile?.firm,
                avatar: i.profile?.avatar
            })),
            averageWatchTime: viewsBreakdown.reduce((sum, v) => sum + (v._sum.watchTime || 0), 0) / (viewsBreakdown.length || 1)
        },
        premium: true
    });
}));

module.exports = router;
