const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, optionalAuth } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/search
 * Quick search for people, videos, and tags
 */
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
    const { q, type = 'all', limit = 10 } = req.query;

    if (!q || q.length < 2) {
        return res.status(400).json({ error: 'Query must be at least 2 characters' });
    }

    const results = { people: [], videos: [], tags: [] };

    // Search people
    if (type === 'all' || type === 'people') {
        const people = await prisma.user.findMany({
            where: {
                OR: [
                    { email: { contains: q, mode: 'insensitive' } },
                    { profile: { bio: { contains: q, mode: 'insensitive' } } },
                    { founderProfile: { tagline: { contains: q, mode: 'insensitive' } } },
                    { investorProfile: { firm: { contains: q, mode: 'insensitive' } } }
                ],
                isActive: true,
                // Don't show private investors in search
                NOT: {
                    AND: [
                        { accountType: 'INVESTOR' },
                        { investorProfile: { isPublicMode: false } }
                    ]
                }
            },
            include: {
                profile: true,
                founderProfile: true,
                investorProfile: true,
                builderProfile: true
            },
            take: parseInt(limit)
        });

        results.people = people.map(p => ({
            id: p.id,
            email: p.email,
            accountType: p.accountType,
            profile: p.profile,
            founderProfile: p.founderProfile,
            investorProfile: p.accountType === 'INVESTOR' ? {
                firm: p.investorProfile?.firm,
                stages: p.investorProfile?.stages
            } : null,
            builderProfile: p.builderProfile
        }));
    }

    // Search videos (by caption and tags)
    if (type === 'all' || type === 'videos') {
        const visibilityFilter = !req.user ? ['PUBLIC']
            : req.user.accountType === 'INVESTOR' ? ['PUBLIC', 'INVESTORS_ONLY']
                : ['PUBLIC', 'COMMUNITY'];

        const videos = await prisma.video.findMany({
            where: {
                OR: [
                    { caption: { contains: q, mode: 'insensitive' } },
                    { tags: { has: q.toLowerCase() } }
                ],
                visibility: { in: visibilityFilter }
            },
            include: {
                user: { include: { profile: true } },
                _count: { select: { likes: true, comments: true } }
            },
            orderBy: { viewCount: 'desc' },
            take: parseInt(limit)
        });

        results.videos = videos;
    }

    // Search/suggest tags
    if (type === 'all' || type === 'tags') {
        // Get unique tags matching query
        const videosWithTags = await prisma.video.findMany({
            where: {
                tags: { hasSome: [q.toLowerCase()] }
            },
            select: { tags: true },
            take: 100
        });

        const tagCounts = {};
        videosWithTags.forEach(v => {
            v.tags.forEach(tag => {
                if (tag.toLowerCase().includes(q.toLowerCase())) {
                    tagCounts[tag] = (tagCounts[tag] || 0) + 1;
                }
            });
        });

        results.tags = Object.entries(tagCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, parseInt(limit))
            .map(([tag, count]) => ({ tag, count }));
    }

    // Save search history if authenticated
    if (req.user) {
        await prisma.searchHistory.create({
            data: {
                userId: req.user.id,
                query: q,
                filters: { type }
            }
        });
    }

    res.json(results);
}));

/**
 * GET /api/search/advanced
 * Advanced search with filters
 */
router.get('/advanced', optionalAuth, asyncHandler(async (req, res) => {
    const {
        type, // founders, investors, builders
        industry,
        stage,
        lookingFor,
        location,
        skills,
        availability,
        investmentStage,
        checkSizeMin,
        checkSizeMax,
        minViews,
        activityDays,
        page = 1,
        limit = 20
    } = req.query;

    let results = [];
    let total = 0;

    if (type === 'founders') {
        const where = {
            accountType: 'FOUNDER',
            isActive: true
        };

        if (location) {
            where.profile = { location: { contains: location, mode: 'insensitive' } };
        }

        if (lookingFor) {
            where.founderProfile = {
                ...(lookingFor === 'funding' && { lookingForFunding: true }),
                ...(lookingFor === 'cofounder' && { lookingForCofounder: true }),
                ...(lookingFor === 'feedback' && { lookingForFeedback: true })
            };
        }

        if (stage) {
            where.founderProfile = {
                ...where.founderProfile,
                fundraisingDetails: { stage }
            };
        }

        results = await prisma.user.findMany({
            where,
            include: {
                profile: true,
                founderProfile: { include: { fundraisingDetails: true } },
                videos: {
                    where: { type: 'PITCH', isPinned: true },
                    take: 1
                },
                _count: { select: { followers: true } }
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        total = await prisma.user.count({ where });

    } else if (type === 'investors') {
        // Only show public investors
        const where = {
            accountType: 'INVESTOR',
            isActive: true,
            investorProfile: {
                isPublicMode: true
            }
        };

        if (investmentStage) {
            where.investorProfile = {
                ...where.investorProfile,
                stages: { has: investmentStage }
            };
        }

        if (industry) {
            where.investorProfile = {
                ...where.investorProfile,
                industries: { has: industry }
            };
        }

        if (checkSizeMin || checkSizeMax) {
            where.investorProfile = {
                ...where.investorProfile,
                ...(checkSizeMin && { checkSizeMin: { gte: parseInt(checkSizeMin) } }),
                ...(checkSizeMax && { checkSizeMax: { lte: parseInt(checkSizeMax) } })
            };
        }

        if (activityDays) {
            // Find investors who engaged recently
            const since = new Date(Date.now() - parseInt(activityDays) * 24 * 60 * 60 * 1000);
            // This would need a subquery - simplified here
        }

        results = await prisma.user.findMany({
            where,
            include: {
                profile: true,
                investorProfile: { include: { portfolio: true } },
                _count: { select: { followers: true } }
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        total = await prisma.user.count({ where });

    } else if (type === 'builders') {
        const where = {
            accountType: 'BUILDER',
            isActive: true
        };

        if (skills) {
            const skillsList = skills.split(',');
            where.builderProfile = {
                skills: { hasSome: skillsList }
            };
        }

        if (availability) {
            where.builderProfile = {
                ...where.builderProfile,
                availability
            };
        }

        if (lookingFor === 'project') {
            where.builderProfile = {
                ...where.builderProfile,
                lookingForProject: true
            };
        }

        if (location) {
            where.profile = { location: { contains: location, mode: 'insensitive' } };
        }

        if (industry) {
            where.builderProfile = {
                ...where.builderProfile,
                industryInterests: { has: industry }
            };
        }

        results = await prisma.user.findMany({
            where,
            include: {
                profile: true,
                builderProfile: true,
                _count: { select: { followers: true } }
            },
            skip: (parseInt(page) - 1) * parseInt(limit),
            take: parseInt(limit)
        });

        total = await prisma.user.count({ where });
    }

    res.json({
        results: results.map(r => ({ ...r, passwordHash: undefined })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / parseInt(limit))
        }
    });
}));

/**
 * GET /api/search/history
 * Get user's search history
 */
router.get('/history', authenticate, asyncHandler(async (req, res) => {
    const history = await prisma.searchHistory.findMany({
        where: { userId: req.user.id },
        orderBy: { createdAt: 'desc' },
        take: 20
    });

    res.json({ history });
}));

/**
 * DELETE /api/search/history
 * Clear search history
 */
router.delete('/history', authenticate, asyncHandler(async (req, res) => {
    await prisma.searchHistory.deleteMany({
        where: { userId: req.user.id }
    });

    res.json({ message: 'Search history cleared' });
}));

module.exports = router;
