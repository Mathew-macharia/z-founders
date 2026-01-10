const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * GET /api/notifications
 * Get user notifications
 */
router.get('/', authenticate, asyncHandler(async (req, res) => {
    const { page = 1, limit = 30, unreadOnly = false } = req.query;

    const where = { userId: req.user.id };
    if (unreadOnly === 'true') {
        where.read = false;
    }

    const notifications = await prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit)
    });

    const unreadCount = await prisma.notification.count({
        where: { userId: req.user.id, read: false }
    });

    res.json({
        notifications,
        unreadCount,
        page: parseInt(page),
        hasMore: notifications.length === parseInt(limit)
    });
}));

/**
 * PATCH /api/notifications/:id/read
 * Mark notification as read
 */
router.patch('/:id/read', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user.id) {
        return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.update({
        where: { id },
        data: { read: true }
    });

    res.json({ message: 'Marked as read' });
}));

/**
 * PATCH /api/notifications/read-all
 * Mark all notifications as read
 */
router.patch('/read-all', authenticate, asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
        where: { userId: req.user.id, read: false },
        data: { read: true }
    });

    res.json({ message: 'All notifications marked as read' });
}));

/**
 * GET /api/notifications/preferences
 * Get notification preferences
 */
router.get('/preferences', authenticate, asyncHandler(async (req, res) => {
    const preferences = await prisma.notificationPreference.findMany({
        where: { userId: req.user.id }
    });

    // Default preferences if none set
    const defaultTypes = [
        'express_interest',
        'new_message',
        'message_request',
        'new_comment',
        'new_follower',
        'trending_video',
        'milestone',
        'weekly_digest',
        'interest_accepted'
    ];

    const prefsMap = {};
    defaultTypes.forEach(type => {
        const existing = preferences.find(p => p.type === type);
        prefsMap[type] = existing || {
            type,
            pushEnabled: true,
            emailEnabled: type === 'weekly_digest' || type === 'express_interest'
        };
    });

    res.json({ preferences: prefsMap });
}));

/**
 * PATCH /api/notifications/preferences
 * Update notification preferences
 */
router.patch('/preferences', authenticate, asyncHandler(async (req, res) => {
    const { preferences } = req.body;

    if (!preferences || typeof preferences !== 'object') {
        return res.status(400).json({ error: 'Preferences object required' });
    }

    for (const [type, settings] of Object.entries(preferences)) {
        await prisma.notificationPreference.upsert({
            where: { userId_type: { userId: req.user.id, type } },
            create: {
                userId: req.user.id,
                type,
                pushEnabled: settings.pushEnabled ?? true,
                emailEnabled: settings.emailEnabled ?? false
            },
            update: {
                pushEnabled: settings.pushEnabled,
                emailEnabled: settings.emailEnabled
            }
        });
    }

    res.json({ message: 'Preferences updated' });
}));

/**
 * DELETE /api/notifications/:id
 * Delete notification
 */
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({ where: { id } });

    if (!notification || notification.userId !== req.user.id) {
        return res.status(404).json({ error: 'Notification not found' });
    }

    await prisma.notification.delete({ where: { id } });

    res.json({ message: 'Notification deleted' });
}));

module.exports = router;
