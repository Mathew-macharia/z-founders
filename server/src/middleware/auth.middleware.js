const jwt = require('jsonwebtoken');
const prisma = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const token = authHeader.split(' ')[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: {
                profile: true,
                subscription: true,
            }
        });

        if (!user || !user.isActive) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: 'Token expired' });
        }
        return res.status(401).json({ error: 'Invalid token' });
    }
};

/**
 * Optional authentication - doesn't fail if no token
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            const user = await prisma.user.findUnique({
                where: { id: decoded.userId },
                include: {
                    profile: true,
                    subscription: true,
                }
            });

            if (user && user.isActive) {
                req.user = user;
            }
        }
        next();
    } catch (error) {
        // Continue without user
        next();
    }
};

/**
 * Check if user has required account type
 */
const requireAccountType = (...allowedTypes) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedTypes.includes(req.user.accountType)) {
            return res.status(403).json({
                error: `This action requires one of these account types: ${allowedTypes.join(', ')}`
            });
        }

        next();
    };
};

/**
 * Check if investor is verified
 */
const requireVerifiedInvestor = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    if (req.user.accountType !== 'INVESTOR') {
        return res.status(403).json({ error: 'Investor account required' });
    }

    const verification = await prisma.investorVerification.findUnique({
        where: { userId: req.user.id }
    });

    if (!verification || verification.status !== 'APPROVED') {
        return res.status(403).json({
            error: 'Verified investor account required',
            verificationStatus: verification?.status || 'NOT_SUBMITTED'
        });
    }

    next();
};

/**
 * Check if user has premium subscription
 */
const requirePremium = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const premiumTiers = ['FOUNDER_PRO', 'INVESTOR_PRO', 'STEALTH_MODE'];

    if (!req.user.subscription || !premiumTiers.includes(req.user.subscription.tier)) {
        return res.status(403).json({
            error: 'Premium subscription required',
            upgradeUrl: '/api/subscriptions/plans'
        });
    }

    // Check if subscription is still valid
    if (req.user.subscription.currentPeriodEnd &&
        new Date(req.user.subscription.currentPeriodEnd) < new Date()) {
        return res.status(403).json({
            error: 'Subscription expired',
            upgradeUrl: '/api/subscriptions/plans'
        });
    }

    next();
};

/**
 * Check content visibility permissions
 */
const checkVideoVisibility = async (req, res, next) => {
    const { videoId } = req.params;

    const video = await prisma.video.findUnique({
        where: { id: videoId },
        include: { user: true }
    });

    if (!video) {
        return res.status(404).json({ error: 'Video not found' });
    }

    // Owner can always see their own videos
    if (req.user && video.userId === req.user.id) {
        req.video = video;
        return next();
    }

    // Check visibility rules
    switch (video.visibility) {
        case 'PUBLIC':
            req.video = video;
            return next();

        case 'COMMUNITY':
            // Only founders and builders can see community content
            if (!req.user || req.user.accountType === 'INVESTOR' || req.user.accountType === 'LURKER') {
                return res.status(403).json({ error: 'Community-only content' });
            }
            req.video = video;
            return next();

        case 'INVESTORS_ONLY':
            // Only verified investors can see
            if (!req.user || req.user.accountType !== 'INVESTOR') {
                return res.status(403).json({ error: 'Investor-only content' });
            }

            const verification = await prisma.investorVerification.findUnique({
                where: { userId: req.user.id }
            });

            if (!verification || verification.status !== 'APPROVED') {
                return res.status(403).json({ error: 'Verified investor required' });
            }

            req.video = video;
            return next();

        default:
            return res.status(403).json({ error: 'Access denied' });
    }
};

module.exports = {
    authenticate,
    optionalAuth,
    requireAccountType,
    requireVerifiedInvestor,
    requirePremium,
    checkVideoVisibility
};
