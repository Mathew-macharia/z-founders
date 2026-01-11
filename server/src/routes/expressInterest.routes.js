const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, requireVerifiedInvestor } = require('../middleware/auth.middleware');
const socketService = require('../services/socket.service');

const router = express.Router();

/**
 * POST /api/express-interest
 * Investor expresses interest in founder's pitch
 */
router.post('/', authenticate, requireVerifiedInvestor, asyncHandler(async (req, res) => {
    const { founderId, videoId, message } = req.body;

    if (!founderId || !videoId) {
        return res.status(400).json({ error: 'Founder ID and Video ID required' });
    }

    // Verify video belongs to founder
    const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { user: true }
    });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    if (video.userId !== founderId) {
        return res.status(400).json({ error: 'Video does not belong to this founder' });
    }

    if (video.user.accountType !== 'FOUNDER') {
        return res.status(400).json({ error: 'Can only express interest in founders' });
    }

    // Create or update interest
    const interest = await prisma.expressInterest.upsert({
        where: {
            investorId_founderId_videoId: {
                investorId: req.user.id,
                founderId,
                videoId
            }
        },
        create: {
            investorId: req.user.id,
            founderId,
            videoId,
            message,
            status: 'pending'
        },
        update: {
            message,
            status: 'pending',
            updatedAt: new Date()
        }
    });

    // Get investor profile to check public/private
    const investorProfile = await prisma.investorProfile.findUnique({
        where: { userId: req.user.id }
    });

    // Create notification
    await prisma.notification.create({
        data: {
            userId: founderId,
            type: 'express_interest',
            priority: 'HIGH',
            title: 'Investor Interested! 🎉',
            body: investorProfile?.isPublicMode
                ? `${investorProfile.firm || 'An investor'} is interested in your pitch`
                : 'A verified investor is interested in your pitch',
            data: {
                interestId: interest.id,
                investorId: req.user.id,
                videoId,
                isPublic: investorProfile?.isPublicMode || false
            }
        }
    });

    // Real-time Notification
    socketService.emitNotification(founderId, {
        type: 'express_interest',
        message: 'An investor is interested in your pitch!',
        data: {
            interestId: interest.id,
            investorId: req.user.id,
            videoId,
            isPublic: investorProfile?.isPublicMode || false
        }
    });

    res.status(201).json({
        interest,
        message: 'Interest expressed successfully'
    });
}));

/**
 * GET /api/express-interest
 * Get interest requests (for founders)
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { status = 'all' } = req.query;

    const where = {
        founderId: req.user.id
    };

    if (status !== 'all') {
        where.status = status;
    }

    const interests = await prisma.expressInterest.findMany({
        where,
        include: {
            investor: {
                include: {
                    profile: true,
                    investorProfile: true
                }
            },
            video: {
                select: { id: true, caption: true, thumbnailUrl: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    // Hide private investor details unless revealed
    const formatted = await Promise.all(interests.map(async (interest) => {
        const isPublic = interest.investor.investorProfile?.isPublicMode;

        // Check if revealed
        const reveal = await prisma.profileReveal.findUnique({
            where: {
                investorId_founderId: {
                    investorId: interest.investorId,
                    founderId: req.user.id
                }
            }
        });

        const showDetails = isPublic || !!reveal || interest.status === 'accepted';

        return {
            ...interest,
            investor: showDetails ? {
                id: interest.investor.id,
                profile: interest.investor.profile,
                investorProfile: interest.investor.investorProfile
            } : {
                id: interest.investor.id,
                accountType: 'INVESTOR',
                isVerified: true,
                isPrivate: true
            }
        };
    }));

    res.json({ interests: formatted });
}));

/**
 * PATCH /api/express-interest/:id
 * Accept or decline interest
 */
router.patch('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'decline'

    if (!['accept', 'decline'].includes(action)) {
        return res.status(400).json({ error: 'Action must be accept or decline' });
    }

    const interest = await prisma.expressInterest.findUnique({
        where: { id },
        include: { investor: true }
    });

    if (!interest) {
        return res.status(404).json({ error: 'Interest not found' });
    }

    if (interest.founderId !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const newStatus = action === 'accept' ? 'accepted' : 'declined';

    await prisma.expressInterest.update({
        where: { id },
        data: { status: newStatus }
    });

    if (action === 'accept') {
        // Create profile reveal
        await prisma.profileReveal.upsert({
            where: {
                investorId_founderId: {
                    investorId: interest.investorId,
                    founderId: req.user.id
                }
            },
            create: {
                investorId: interest.investorId,
                founderId: req.user.id
            },
            update: {}
        });

        // Create or update conversation to active
        let conversation = await prisma.conversation.findFirst({
            where: {
                OR: [
                    { participant1Id: req.user.id, participant2Id: interest.investorId },
                    { participant1Id: interest.investorId, participant2Id: req.user.id }
                ]
            }
        });

        if (!conversation) {
            conversation = await prisma.conversation.create({
                data: {
                    participant1Id: req.user.id,
                    participant2Id: interest.investorId,
                    status: 'ACTIVE',
                    isRevealed: true
                }
            });
        } else {
            await prisma.conversation.update({
                where: { id: conversation.id },
                data: { status: 'ACTIVE', isRevealed: true }
            });
        }

        // Notify investor
        await prisma.notification.create({
            data: {
                userId: interest.investorId,
                type: 'interest_accepted',
                priority: 'HIGH',
                title: 'Interest Accepted!',
                body: 'The founder has accepted your interest. You can now message them.',
                data: { founderId: req.user.id, conversationId: conversation.id }
            }
        });

        // Real-time Notification
        socketService.emitNotification(interest.investorId, {
            type: 'interest_accepted',
            message: 'Founder accepted your interest! You can now message them.',
            data: { founderId: req.user.id, conversationId: conversation.id }
        });

        res.json({
            message: 'Interest accepted',
            conversationId: conversation.id
        });
    } else {
        // Silent decline - don't notify investor
        res.json({ message: 'Interest declined' });
    }
}));

/**
 * GET /api/express-interest/sent
 * Get interests sent by investor
 */
router.get('/sent', authenticate, requireVerifiedInvestor, asyncHandler(async (req, res) => {
    const interests = await prisma.expressInterest.findMany({
        where: { investorId: req.user.id },
        include: {
            founder: {
                include: {
                    profile: true,
                    founderProfile: true
                }
            },
            video: {
                select: { id: true, caption: true, thumbnailUrl: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ interests });
}));

module.exports = router;
