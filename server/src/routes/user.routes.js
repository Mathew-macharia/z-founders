const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, requireAccountType } = require('../middleware/auth.middleware');
const socketService = require('../services/socket.service');

const router = express.Router();

/**
 * GET /api/users/:id
 * Get user profile by ID
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: {
                include: { socialLinks: true }
            },
            founderProfile: {
                include: { fundraisingDetails: true }
            },
            investorProfile: req.user.accountType === 'INVESTOR' || id === req.user.id ? {
                include: { portfolio: true }
            } : false,
            builderProfile: true,
            videos: {
                where: {
                    OR: [
                        { visibility: 'PUBLIC' },
                        ...(req.user.accountType === 'INVESTOR' ? [{ visibility: 'INVESTORS_ONLY' }] : []),
                        ...(req.user.accountType !== 'INVESTOR' && req.user.accountType !== 'LURKER'
                            ? [{ visibility: 'COMMUNITY' }] : []),
                        { userId: req.user.id }
                    ]
                },
                orderBy: [
                    { isPinned: 'desc' },
                    { createdAt: 'desc' }
                ],
                take: 20
            },
            _count: {
                select: {
                    followers: true,
                    following: true,
                    videos: true
                }
            }
        }
    });

    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if investor profile should be hidden
    if (user.accountType === 'INVESTOR' &&
        user.investorProfile &&
        !user.investorProfile.isPublicMode &&
        id !== req.user.id) {
        // Check if there's a profile reveal
        const reveal = await prisma.profileReveal.findUnique({
            where: {
                investorId_founderId: {
                    investorId: id,
                    founderId: req.user.id
                }
            }
        });

        if (!reveal) {
            // Hide detailed investor info
            user.investorProfile = {
                firm: user.investorProfile.firm,
                stages: user.investorProfile.stages,
                // Hide other details
            };
        }
    }

    // Check if current user follows this user
    const isFollowing = await prisma.follow.findUnique({
        where: {
            followerId_followingId: {
                followerId: req.user.id,
                followingId: id
            }
        }
    });

    res.json({
        user: {
            ...user,
            passwordHash: undefined
        },
        isFollowing: !!isFollowing,
        isOwnProfile: id === req.user.id
    });
}));

/**
 * PATCH /api/users/:id
 * Update user profile
 */
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id !== req.user.id) {
        return res.status(403).json({ error: 'Cannot update other users' });
    }

    const { profile, founderProfile, investorProfile, builderProfile, socialLinks } = req.body;

    // Helper to request cleaning
    const cleanProfileData = (data, intFields = []) => {
        const cleaned = { ...data };
        Object.keys(cleaned).forEach(key => {
            if (cleaned[key] === '') {
                cleaned[key] = undefined; // Prisma treats undefined as "do nothing" in update, or null if nullable
            } else if (intFields.includes(key) && cleaned[key]) {
                cleaned[key] = parseInt(cleaned[key], 10);
            }
        });
        return cleaned;
    };

    // Update base profile
    if (profile) {
        await prisma.userProfile.update({
            where: { userId: id },
            data: {
                avatar: profile.avatar,
                bio: profile.bio,
                location: profile.location,
                website: profile.website,
                isPublic: profile.isPublic,
                showInSearch: profile.showInSearch,
                showActivityStatus: profile.showActivityStatus,
                allowMessagesFromEveryone: profile.allowMessagesFromEveryone
            }
        });
    }

    // Update type-specific profiles
    if (founderProfile && req.user.accountType === 'FOUNDER') {
        const cleanedFounder = cleanProfileData(founderProfile);

        await prisma.founderProfile.upsert({
            where: { userId: id },
            create: {
                userId: id,
                ...cleanedFounder
            },
            update: cleanedFounder
        });

        // Update fundraising details if provided
        if (founderProfile.fundraisingDetails) {
            const cleaningFundraising = cleanProfileData(founderProfile.fundraisingDetails, ['amount']);

            const fp = await prisma.founderProfile.findUnique({ where: { userId: id } });
            await prisma.fundraisingDetails.upsert({
                where: { founderId: fp.id },
                create: {
                    founderId: fp.id,
                    ...cleaningFundraising
                },
                update: cleaningFundraising
            });
        }
    }

    if (investorProfile && req.user.accountType === 'INVESTOR') {
        const cleanedInvestor = cleanProfileData(investorProfile, ['checkSizeMin', 'checkSizeMax', 'investmentYear']);

        await prisma.investorProfile.upsert({
            where: { userId: id },
            create: {
                userId: id,
                ...cleanedInvestor
            },
            update: cleanedInvestor
        });
    }

    if (builderProfile && req.user.accountType === 'BUILDER') {
        const cleanedBuilder = cleanProfileData(builderProfile);

        await prisma.builderProfile.upsert({
            where: { userId: id },
            create: {
                userId: id,
                ...cleanedBuilder
            },
            update: cleanedBuilder
        });
    }

    // Update social links
    if (socialLinks) {
        const userProfile = await prisma.userProfile.findUnique({ where: { userId: id } });

        // Delete existing and recreate
        await prisma.socialLink.deleteMany({ where: { profileId: userProfile.id } });

        for (const link of socialLinks) {
            await prisma.socialLink.create({
                data: {
                    profileId: userProfile.id,
                    platform: link.platform,
                    url: link.url
                }
            });
        }
    }

    // Return updated user
    const updatedUser = await prisma.user.findUnique({
        where: { id },
        include: {
            profile: { include: { socialLinks: true } },
            founderProfile: { include: { fundraisingDetails: true } },
            investorProfile: { include: { portfolio: true } },
            builderProfile: true
        }
    });

    res.json({ user: updatedUser });
}));

/**
 * POST /api/users/switch-type
 * Switch account type (builder <-> founder)
 */
router.post('/switch-type', authenticate, asyncHandler(async (req, res) => {
    const { newType } = req.body;

    // Validate allowed switches
    const allowedSwitches = {
        'FOUNDER': ['BUILDER'],
        'BUILDER': ['FOUNDER'],
        'LURKER': ['FOUNDER', 'BUILDER', 'INVESTOR']
    };

    const allowed = allowedSwitches[req.user.accountType];
    if (!allowed || !allowed.includes(newType)) {
        return res.status(400).json({
            error: 'Invalid account type switch',
            allowed: allowed || []
        });
    }

    // Check cooldown (30 days)
    const recentChange = await prisma.accountTypeChange.findFirst({
        where: {
            userId: req.user.id,
            changedAt: {
                gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            }
        }
    });

    if (recentChange) {
        return res.status(400).json({
            error: 'Can only switch account type once per 30 days',
            nextAvailable: new Date(recentChange.changedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
        });
    }

    // Perform switch
    await prisma.$transaction(async (tx) => {
        // Update user type
        await tx.user.update({
            where: { id: req.user.id },
            data: { accountType: newType }
        });

        // Log the change
        await tx.accountTypeChange.create({
            data: {
                userId: req.user.id,
                fromType: req.user.accountType,
                toType: newType
            }
        });

        // Create new type-specific profile
        if (newType === 'FOUNDER') {
            await tx.founderProfile.upsert({
                where: { userId: req.user.id },
                create: { userId: req.user.id },
                update: {}
            });
        } else if (newType === 'BUILDER') {
            await tx.builderProfile.upsert({
                where: { userId: req.user.id },
                create: { userId: req.user.id },
                update: {}
            });
        } else if (newType === 'INVESTOR') {
            await tx.investorProfile.upsert({
                where: { userId: req.user.id },
                create: { userId: req.user.id },
                update: {}
            });
            await tx.investorVerification.upsert({
                where: { userId: req.user.id },
                create: { userId: req.user.id, status: 'PENDING' },
                update: { status: 'PENDING' }
            });
        }
    });

    res.json({
        message: 'Account type switched successfully',
        newType,
        requiresVerification: newType === 'INVESTOR'
    });
}));

/**
 * POST /api/users/:id/follow
 * Follow a user
 */
router.post('/:id/follow', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
    }

    // Check if investor is private
    if (targetUser.accountType === 'INVESTOR') {
        const investorProfile = await prisma.investorProfile.findUnique({
            where: { userId: id }
        });

        if (investorProfile && !investorProfile.isPublicMode) {
            return res.status(403).json({ error: 'Cannot follow private investor profiles' });
        }
    }

    await prisma.follow.upsert({
        where: {
            followerId_followingId: {
                followerId: req.user.id,
                followingId: id
            }
        },
        create: {
            followerId: req.user.id,
            followingId: id
        },
        update: {}
    });

    // Create notification
    await prisma.notification.create({
        data: {
            userId: id,
            type: 'new_follower',
            priority: 'MEDIUM',
            title: 'New Follower',
            body: `${req.user.email} started following you`,
            data: { followerId: req.user.id }
        }
    });

    // Real-time Notification
    socketService.emitNotification(id, {
        type: 'new_follower',
        message: `${req.user.email} followed you`,
        data: { followerId: req.user.id }
    });

    res.json({ message: 'Following user' });
}));

/**
 * DELETE /api/users/:id/follow
 * Unfollow a user
 */
router.delete('/:id/follow', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.follow.deleteMany({
        where: {
            followerId: req.user.id,
            followingId: id
        }
    });

    res.json({ message: 'Unfollowed user' });
}));

/**
 * GET /api/users/me/blocked
 * Get users blocked by current user
 */
router.get('/me/blocked', authenticate, asyncHandler(async (req, res) => {
    const blocked = await prisma.block.findMany({
        where: { blockerId: req.user.id },
        include: { blocked: { include: { profile: true } } }
    });

    const formatted = blocked.map(b => ({
        id: b.blocked.id,
        email: b.blocked.email,
        profile: b.blocked.profile,
        blockedAt: b.createdAt
    }));

    res.json({ blocked: formatted });
}));

/**
 * POST /api/users/:id/block
 * Block a user
 */
router.post('/:id/block', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (id === req.user.id) {
        return res.status(400).json({ error: 'Cannot block yourself' });
    }

    // Check if already blocked
    const existing = await prisma.block.findUnique({
        where: {
            blockerId_blockedId: {
                blockerId: req.user.id,
                blockedId: id
            }
        }
    });

    if (existing) {
        return res.json({ message: 'User already blocked' });
    }

    // Create block
    await prisma.block.create({
        data: {
            blockerId: req.user.id,
            blockedId: id
        }
    });

    // Also force unfollow both ways
    await prisma.follow.deleteMany({
        where: {
            OR: [
                { followerId: req.user.id, followingId: id },
                { followerId: id, followingId: req.user.id }
            ]
        }
    });

    res.json({ message: 'User blocked' });
}));

/**
 * DELETE /api/users/:id/block
 * Unblock a user
 */
router.delete('/:id/block', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    await prisma.block.deleteMany({
        where: {
            blockerId: req.user.id,
            blockedId: id
        }
    });

    res.json({ message: 'User unblocked' });
}));

/**
 * GET /api/users/me/export
 * Export user data (JSON)
 */
router.get('/me/export', authenticate, asyncHandler(async (req, res) => {
    const fullUser = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            profile: true,
            founderProfile: true,
            investorProfile: true,
            builderProfile: true,
            videos: true,
            messagesSent: true,
            sentMessages: { include: { conversation: true } },
            following: true,
            followers: true,
            searchHistory: true,
            sessions: true
        }
    });

    // Sanitize
    const exportData = {
        ...fullUser,
        passwordHash: undefined,
        resetPasswordToken: undefined,
        sentMessages: fullUser.sentMessages.map(m => ({
            content: m.content,
            sentAt: m.createdAt,
            conversationId: m.conversationId
        }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=zfounders-data.json');
    res.json(exportData);
}));

/**
 * DELETE /api/users/me
 * Permanently delete account
 */
router.delete('/me', authenticate, asyncHandler(async (req, res) => {
    // Hard delete - Cascade will handle relations
    await prisma.user.delete({
        where: { id: req.user.id }
    });

    res.json({ message: 'Account permanently deleted' });
}));

/**
 * GET /api/users/:id/followers
 * Get user's followers
 */
router.get('/:id/followers', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const followers = await prisma.follow.findMany({
        where: { followingId: id },
        include: {
            follower: {
                include: { profile: true }
            }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({ where: { followingId: id } });

    res.json({
        followers: followers.map(f => ({
            ...f.follower,
            passwordHash: undefined
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));

/**
 * GET /api/users/:id/following
 * Get users this user follows
 */
router.get('/:id/following', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const following = await prisma.follow.findMany({
        where: { followerId: id },
        include: {
            following: {
                include: { profile: true }
            }
        },
        skip: (page - 1) * limit,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.follow.count({ where: { followerId: id } });

    res.json({
        following: following.map(f => ({
            ...f.following,
            passwordHash: undefined
        })),
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    });
}));

module.exports = router;
