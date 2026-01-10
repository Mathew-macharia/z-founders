const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Simple admin check (in production, use proper admin roles)
const requireAdmin = (req, res, next) => {
    // For now, check a simple flag - in production use proper RBAC
    if (!req.user || !req.user.email.endsWith('@zfounders.admin')) {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

/**
 * GET /api/moderation/queue
 * Get moderation queue (admin only)
 */
router.get('/queue', authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const { type = 'reports', status = 'pending' } = req.query;

    if (type === 'reports') {
        const reports = await prisma.contentReport.findMany({
            where: { status },
            include: {
                reporter: { select: { id: true, email: true } },
                video: {
                    include: {
                        user: { select: { id: true, email: true } }
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return res.json({ queue: reports });
    }

    if (type === 'verifications') {
        const verifications = await prisma.investorVerification.findMany({
            where: { status: 'PENDING' },
            include: {
                user: {
                    include: {
                        profile: true,
                        investorProfile: true
                    }
                }
            },
            orderBy: { createdAt: 'asc' }
        });

        return res.json({ queue: verifications });
    }

    if (type === 'flags') {
        const flags = await prisma.contentFlag.findMany({
            include: {
                // Need to join with video somehow
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        return res.json({ queue: flags });
    }

    res.status(400).json({ error: 'Invalid queue type' });
}));

/**
 * POST /api/moderation/action
 * Take moderation action (admin only)
 */
router.post('/action', authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const { targetType, targetId, action, reason, duration } = req.body;

    // targetType: 'video', 'user', 'report', 'verification'
    // action: 'remove', 'warn', 'suspend', 'ban', 'approve', 'reject', 'dismiss'

    if (targetType === 'video') {
        if (action === 'remove') {
            await prisma.video.delete({ where: { id: targetId } });
            return res.json({ message: 'Video removed' });
        }
    }

    if (targetType === 'user') {
        const actionMap = {
            'warn': 'WARNING',
            'suspend': duration === 7 ? 'SUSPEND_7_DAY' : 'SUSPEND_30_DAY',
            'ban': 'PERMANENT_BAN'
        };

        if (!actionMap[action]) {
            return res.status(400).json({ error: 'Invalid action' });
        }

        // Create moderation record
        await prisma.moderationActionRecord.create({
            data: {
                userId: targetId,
                action: actionMap[action],
                reason,
                expiresAt: action === 'suspend'
                    ? new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000)
                    : null
            }
        });

        // Deactivate if ban or suspend
        if (['suspend', 'ban'].includes(action)) {
            await prisma.user.update({
                where: { id: targetId },
                data: { isActive: false }
            });
        }

        return res.json({ message: `User ${action}ed` });
    }

    if (targetType === 'report') {
        await prisma.contentReport.update({
            where: { id: targetId },
            data: {
                status: action === 'dismiss' ? 'dismissed' : 'reviewed',
                reviewedAt: new Date()
            }
        });

        return res.json({ message: 'Report updated' });
    }

    if (targetType === 'verification') {
        const newStatus = action === 'approve' ? 'APPROVED' : 'REJECTED';

        await prisma.investorVerification.update({
            where: { id: targetId },
            data: {
                status: newStatus,
                reviewerNotes: reason,
                reviewedAt: new Date()
            }
        });

        // Notify user
        const verification = await prisma.investorVerification.findUnique({
            where: { id: targetId }
        });

        await prisma.notification.create({
            data: {
                userId: verification.userId,
                type: 'verification_result',
                priority: 'HIGH',
                title: newStatus === 'APPROVED'
                    ? 'Investor Verification Approved! 🎉'
                    : 'Verification Update',
                body: newStatus === 'APPROVED'
                    ? 'You can now access all investor features.'
                    : `Your verification was not approved. ${reason || ''}`
            }
        });

        return res.json({ message: `Verification ${action}d` });
    }

    res.status(400).json({ error: 'Invalid target type' });
}));

/**
 * GET /api/moderation/stats
 * Get moderation statistics (admin only)
 */
router.get('/stats', authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const [
        pendingReports,
        pendingVerifications,
        recentActions,
        activeUsers,
        suspendedUsers
    ] = await Promise.all([
        prisma.contentReport.count({ where: { status: 'pending' } }),
        prisma.investorVerification.count({ where: { status: 'PENDING' } }),
        prisma.moderationActionRecord.count({
            where: { createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
        }),
        prisma.user.count({ where: { isActive: true } }),
        prisma.user.count({ where: { isActive: false } })
    ]);

    res.json({
        stats: {
            pendingReports,
            pendingVerifications,
            recentActions,
            activeUsers,
            suspendedUsers
        }
    });
}));

module.exports = router;
