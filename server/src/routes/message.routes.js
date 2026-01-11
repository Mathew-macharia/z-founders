const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate, requireAccountType, requireVerifiedInvestor } = require('../middleware/auth.middleware');
const socketService = require('../services/socket.service');

const router = express.Router();

/**
 * Check message limit for user
 */
const checkMessageLimit = async (userId, targetAccountType, userSubscription) => {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { investorVerification: true }
    });

    // CRITICAL: Block Lurkers completely
    if (user.accountType === 'LURKER') {
        return {
            allowed: false,
            reason: 'Lurkers cannot send messages. Please upgrade your account.'
        };
    }

    // CRITICAL: Block Pending Investors
    if (user.accountType === 'INVESTOR') {
        if (user.investorVerification?.status !== 'APPROVED') {
            return {
                allowed: false,
                reason: 'You must be a verified investor to send messages.'
            };
        }
        // Verified investors have unlimited messaging
        return { allowed: true };
    }

    // Only limit messages TO investors
    if (targetAccountType !== 'INVESTOR') {
        return { allowed: true };
    }

    // Premium users have unlimited
    const premiumTiers = ['FOUNDER_PRO', 'INVESTOR_PRO', 'STEALTH_MODE'];
    if (premiumTiers.includes(userSubscription?.tier)) {
        return { allowed: true };
    }

    // Check limits
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let limit = await prisma.messageLimit.findFirst({
        where: { userId, period: 'monthly' }
    });

    if (!limit || limit.resetsAt < now) {
        // Create/reset limit
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        limit = await prisma.messageLimit.upsert({
            where: { userId_period: { userId, period: 'monthly' } },
            create: { userId, period: 'monthly', count: 0, resetsAt: nextMonth },
            update: { count: 0, resetsAt: nextMonth }
        });
    }

    const maxLimit = user.accountType === 'FOUNDER'
        ? parseInt(process.env.FREE_INVESTOR_DM_LIMIT) || 3
        : parseInt(process.env.BUILDER_INVESTOR_DM_LIMIT) || 5;

    if (limit.count >= maxLimit) {
        return {
            allowed: false,
            reason: `Monthly limit of ${maxLimit} investor messages reached`,
            resetsAt: limit.resetsAt
        };
    }

    return { allowed: true, currentCount: limit.count, limit: maxLimit };
};

/**
 * GET /api/conversations
 * Get all conversations
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { status = 'all' } = req.query;

    const where = {
        OR: [
            { participant1Id: req.user.id },
            { participant2Id: req.user.id }
        ]
    };

    if (status !== 'all') {
        where.status = status.toUpperCase();
    }

    const conversations = await prisma.conversation.findMany({
        where,
        include: {
            participant1: {
                include: {
                    profile: true,
                    investorProfile: true
                }
            },
            participant2: {
                include: {
                    profile: true,
                    investorProfile: true
                }
            },
            messages: {
                take: 1,
                orderBy: { createdAt: 'desc' }
            }
        },
        orderBy: { lastMessageAt: 'desc' }
    });

    // Format for client - determine other participant
    const formatted = conversations.map(conv => {
        const otherParticipant = conv.participant1Id === req.user.id
            ? conv.participant2
            : conv.participant1;

        // Check if investor profile should be hidden
        let showProfile = true;
        if (otherParticipant.accountType === 'INVESTOR' &&
            otherParticipant.investorProfile &&
            !otherParticipant.investorProfile.isPublicMode &&
            !conv.isRevealed) {
            showProfile = false;
        }

        return {
            id: conv.id,
            status: conv.status,
            lastMessage: conv.messages[0],
            lastMessageAt: conv.lastMessageAt,
            otherParticipant: showProfile ? {
                id: otherParticipant.id,
                email: otherParticipant.email,
                accountType: otherParticipant.accountType,
                profile: otherParticipant.profile,
                investorProfile: otherParticipant.investorProfile
            } : {
                id: otherParticipant.id,
                accountType: 'INVESTOR',
                isPrivate: true
            }
        };
    });

    res.json({ conversations: formatted });
}));

/**
 * GET /api/conversations/requests
 * Get message requests (from investors to founders)
 */
router.get('/requests', authenticate, asyncHandler(async (req, res) => {
    const conversations = await prisma.conversation.findMany({
        where: {
            OR: [
                { participant1Id: req.user.id },
                { participant2Id: req.user.id }
            ],
            status: 'REQUEST'
        },
        include: {
            participant1: {
                include: { profile: true, investorProfile: true }
            },
            participant2: {
                include: { profile: true, investorProfile: true }
            },
            messages: {
                take: 1,
                orderBy: { createdAt: 'asc' }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    res.json({ requests: conversations });
}));

/**
 * GET /api/conversations/:id
 * Get conversation messages
 */
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            participant1: { include: { profile: true, investorProfile: true } },
            participant2: { include: { profile: true, investorProfile: true } }
        }
    });

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check access
    if (conversation.participant1Id !== req.user.id &&
        conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    const messages = await prisma.message.findMany({
        where: { conversationId: id },
        include: {
            sender: { include: { profile: true } }
        },
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    // Mark messages as read
    await prisma.message.updateMany({
        where: {
            conversationId: id,
            senderId: { not: req.user.id },
            readAt: null
        },
        data: { readAt: new Date() }
    });

    res.json({
        conversation,
        messages: messages.reverse(),
        page: parseInt(page),
        hasMore: messages.length === parseInt(limit)
    });
}));

/**
 * POST /api/conversations/:id/messages
 * Send message in conversation
 */
router.post('/:id/messages', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { content, type = 'text', attachmentUrl } = req.body;

    if (!content?.trim() && !attachmentUrl) {
        return res.status(400).json({ error: 'Message content required' });
    }

    const conversation = await prisma.conversation.findUnique({
        where: { id },
        include: {
            participant1: true,
            participant2: true
        }
    });

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    // Check access
    if (conversation.participant1Id !== req.user.id &&
        conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Check if conversation is in request status
    if (conversation.status === 'REQUEST') {
        return res.status(403).json({ error: 'Conversation must be accepted first' });
    }

    if (conversation.status === 'BLOCKED') {
        return res.status(403).json({ error: 'Conversation is blocked' });
    }

    const message = await prisma.message.create({
        data: {
            conversationId: id,
            senderId: req.user.id,
            content: content?.trim(),
            type,
            attachmentUrl
        },
        include: {
            sender: { include: { profile: true } }
        }
    });

    // Update conversation
    await prisma.conversation.update({
        where: { id },
        data: { lastMessageAt: new Date() }
    });

    // Create notification for recipient
    const recipientId = conversation.participant1Id === req.user.id
        ? conversation.participant2Id
        : conversation.participant1Id;

    await prisma.notification.create({
        data: {
            userId: recipientId,
            type: 'new_message',
            priority: 'HIGH',
            title: 'New Message',
            body: content?.substring(0, 50) + (content?.length > 50 ? '...' : ''),
            data: { conversationId: id, messageId: message.id }
        }
    });

    // Real-time Notification
    socketService.emitNotification(recipientId, {
        type: 'new_message',
        message: `New message from ${req.user.email}`,
        data: { conversationId: id, messageId: message.id }
    });

    res.status(201).json({ message });
}));

/**
 * POST /api/messages
 * Start new conversation / send message to user
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { recipientId, content, type = 'text' } = req.body;

    if (!recipientId || !content?.trim()) {
        return res.status(400).json({ error: 'Recipient and content required' });
    }

    const recipient = await prisma.user.findUnique({
        where: { id: recipientId },
        include: { subscription: true }
    });

    if (!recipient) {
        return res.status(404).json({ error: 'Recipient not found' });
    }

    // CHECK 1: BLOCKING
    const blockCheck = await prisma.block.findFirst({
        where: {
            OR: [
                { blockerId: recipientId, blockedId: req.user.id }, // Recipient blocked me
                { blockerId: req.user.id, blockedId: recipientId }  // I blocked recipient
            ]
        }
    });

    if (blockCheck) {
        return res.status(403).json({ error: 'You cannot message this user' });
    }

    // CHECK 2: PRIVACY (Messages from everyone)
    if (recipient.profile?.allowMessagesFromEveryone === false) {
        // Must be following to message
        const isFollowing = await prisma.follow.findUnique({
            where: {
                followerId_followingId: {
                    followerId: req.user.id,
                    followingId: recipientId
                }
            }
        });

        // Also allow if there is an existing CONVERSATION (that was previously accepted)
        // But for new messages, we usually rely on "isFollowing" or "isConnected"
        if (!isFollowing) {
            // Optional: Allow if they are connected in some other way (e.g. accepted match)
            // For now, strict follow check if privacy is on
            return res.status(403).json({ error: 'This user only accepts messages from people they know' });
        }
    }

    // CHECK 3: LIMITS
    // Check message limits
    const limitCheck = await checkMessageLimit(
        req.user.id,
        recipient.accountType,
        req.user.subscription
    );

    if (!limitCheck.allowed) {
        return res.status(429).json({
            error: limitCheck.reason,
            resetsAt: limitCheck.resetsAt,
            upgradeUrl: '/api/subscriptions/plans'
        });
    }

    // Check if conversation exists
    let conversation = await prisma.conversation.findFirst({
        where: {
            OR: [
                { participant1Id: req.user.id, participant2Id: recipientId },
                { participant1Id: recipientId, participant2Id: req.user.id }
            ]
        }
    });

    // Determine conversation status
    let status = 'ACTIVE';
    let isRevealed = true;

    // If sender is investor messaging founder, goes to requests unless via express interest
    if (req.user.accountType === 'INVESTOR' && recipient.accountType === 'FOUNDER') {
        // Check for accepted express interest
        const expressInterest = await prisma.expressInterest.findFirst({
            where: {
                investorId: req.user.id,
                founderId: recipientId,
                status: 'accepted'
            }
        });

        if (!expressInterest && !conversation) {
            status = 'REQUEST';
        }

        // Check if investor is private
        const investorProfile = await prisma.investorProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (investorProfile && !investorProfile.isPublicMode) {
            isRevealed = false;
        }
    }

    if (!conversation) {
        conversation = await prisma.conversation.create({
            data: {
                participant1Id: req.user.id,
                participant2Id: recipientId,
                status,
                isRevealed,
                lastMessageAt: new Date()
            }
        });
    }

    const message = await prisma.message.create({
        data: {
            conversationId: conversation.id,
            senderId: req.user.id,
            content: content.trim(),
            type
        },
        include: {
            sender: { include: { profile: true } }
        }
    });

    // Increment message limit if messaging investor
    if (recipient.accountType === 'INVESTOR' && limitCheck.currentCount !== undefined) {
        await prisma.messageLimit.update({
            where: { userId_period: { userId: req.user.id, period: 'monthly' } },
            data: { count: { increment: 1 } }
        });
    }

    // Create notification
    const notifType = status === 'REQUEST' ? 'message_request' : 'new_message';
    await prisma.notification.create({
        data: {
            userId: recipientId,
            type: notifType,
            priority: 'HIGH',
            title: status === 'REQUEST' ? 'Message Request' : 'New Message',
            body: content.substring(0, 50) + (content.length > 50 ? '...' : ''),
            data: { conversationId: conversation.id }
        }
    });

    // Real-time Notification
    socketService.emitNotification(recipientId, {
        type: notifType, // 'new_message' or 'message_request'
        message: status === 'REQUEST' ? 'New message request' : `New message from ${req.user.email}`,
        data: { conversationId: conversation.id }
    });

    res.status(201).json({
        conversation,
        message,
        status
    });
}));

/**
 * PATCH /api/conversations/:id/accept
 * Accept conversation request
 */
router.patch('/:id/accept', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1Id !== req.user.id &&
        conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.conversation.update({
        where: { id },
        data: { status: 'ACTIVE', isRevealed: true }
    });

    res.json({ message: 'Conversation accepted' });
}));

/**
 * PATCH /api/conversations/:id/decline
 * Decline conversation request (silent)
 */
router.patch('/:id/decline', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const conversation = await prisma.conversation.findUnique({ where: { id } });

    if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
    }

    if (conversation.participant1Id !== req.user.id &&
        conversation.participant2Id !== req.user.id) {
        return res.status(403).json({ error: 'Access denied' });
    }

    // Silently delete
    await prisma.conversation.delete({ where: { id } });

    res.json({ message: 'Request declined' });
}));

module.exports = router;
