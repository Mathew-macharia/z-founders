const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/reports
 * Report content
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { videoId, category, details } = req.body;

    const validCategories = ['SPAM', 'SCAM', 'INAPPROPRIATE', 'STOLEN_IDEA', 'HARASSMENT'];
    if (!validCategories.includes(category)) {
        return res.status(400).json({ error: 'Invalid report category' });
    }

    const video = await prisma.video.findUnique({ where: { id: videoId } });
    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    // Check for existing report
    const existing = await prisma.contentReport.findFirst({
        where: {
            reporterId: req.user.id,
            videoId,
            status: 'pending'
        }
    });

    if (existing) {
        return res.status(400).json({ error: 'You have already reported this content' });
    }

    const report = await prisma.contentReport.create({
        data: {
            reporterId: req.user.id,
            videoId,
            category,
            details
        }
    });

    // Check if 3+ reports - add to priority queue
    const reportCount = await prisma.contentReport.count({
        where: { videoId, status: 'pending' }
    });

    if (reportCount >= 3) {
        await prisma.contentFlag.create({
            data: {
                videoId,
                flagType: 'community_flagged',
                severity: 'high',
                details: `${reportCount} community reports`
            }
        });
    }

    res.status(201).json({
        message: 'Report submitted',
        reportId: report.id
    });
}));

module.exports = router;
