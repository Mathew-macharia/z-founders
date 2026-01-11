const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

/**
 * POST /api/auth/register
 * Create a new user account
 */
router.post('/register', asyncHandler(async (req, res) => {
    const { email, password, accountType = 'LURKER' } = req.body;

    // Validate input
    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    if (password.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Check valid account types
    const validTypes = ['FOUNDER', 'BUILDER', 'INVESTOR', 'LURKER'];
    if (!validTypes.includes(accountType)) {
        return res.status(400).json({ error: 'Invalid account type' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user with profile
    const user = await prisma.user.create({
        data: {
            email: email.toLowerCase().trim(),
            passwordHash,
            accountType,
            profile: {
                create: {}
            },
            subscription: {
                create: {
                    tier: 'FREE'
                }
            },
            onboardingProgress: {
                create: {
                    step: 0
                }
            },
            // Create type-specific profile
            ...(accountType === 'FOUNDER' && {
                founderProfile: { create: {} }
            }),
            ...(accountType === 'BUILDER' && {
                builderProfile: { create: {} }
            }),
            ...(accountType === 'INVESTOR' && {
                investorProfile: { create: {} },
                investorVerification: { create: { status: 'PENDING' } }
            })
        },
        include: {
            profile: true,
            subscription: true
        }
    });

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    await prisma.session.create({
        data: {
            userId: user.id,
            token,
            device: req.headers['user-agent'],
            ip: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    res.status(201).json({
        message: 'Account created successfully',
        user: {
            id: user.id,
            email: user.email,
            accountType: user.accountType,
            isVerified: user.isVerified
        },
        token,
        requiresVerification: accountType === 'INVESTOR'
    });
}));

/**
 * POST /api/auth/login
 * Authenticate existing user
 */
router.post('/login', asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() },
        include: {
            profile: true,
            subscription: true,
            investorVerification: true
        }
    });

    if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    if (!user.isActive) {
        return res.status(403).json({ error: 'Account is suspended' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
        return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
        { userId: user.id },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    // Create session
    await prisma.session.create({
        data: {
            userId: user.id,
            token,
            device: req.headers['user-agent'],
            ip: req.ip,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        }
    });

    res.json({
        user: {
            id: user.id,
            email: user.email,
            accountType: user.accountType,
            isVerified: user.isVerified,
            profile: user.profile,
            subscriptionTier: user.subscription?.tier,
            investorVerificationStatus: user.investorVerification?.status
        },
        token
    });
}));

/**
 * POST /api/auth/logout
 * Invalidate current session
 */
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (token) {
        await prisma.session.deleteMany({
            where: { token }
        });
    }

    res.json({ message: 'Logged out successfully' });
}));

/**
 * POST /api/auth/verify-email
 * Verify user email (placeholder - implement with email service)
 */
router.post('/verify-email', asyncHandler(async (req, res) => {
    const { token } = req.body;

    // TODO: Implement actual email verification with token
    // For now, mark user as verified directly

    res.json({ message: 'Email verification endpoint - implement with email service' });
}));

/**
 * POST /api/auth/change-password
 * Change current user password
 */
router.post('/change-password', authenticate, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Current and new password required' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    const user = await prisma.user.findUnique({
        where: { id: req.user.id }
    });

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
        return res.status(401).json({ error: 'Incorrect current password' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: req.user.id },
        data: { passwordHash }
    });

    res.json({ message: 'Password updated successfully' });
}));

/**
 * POST /api/auth/forgot-password
 * Request password reset
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
    const { email } = req.body;
    const crypto = require('crypto');
    const { sendEmail } = require('../services/email.service');

    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
        // Return success even if user not found to prevent enumeration
        return res.json({ message: 'If an account exists with this email, a reset link will be sent' });
    }

    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
        where: { id: user.id },
        data: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: expiresAt
        }
    });

    // Send email
    const resetUrl = `https://zfounders.com/reset-password?token=${token}`;
    const message = `
        <h1>Password Reset Request</h1>
        <p>You requested a password reset for your Z Founders account.</p>
        <p>Please click the link below to reset your password:</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>This link will expire in 1 hour.</p>
        <p>If you didn't request this, please ignore this email.</p>
    `;

    await sendEmail({
        to: user.email,
        subject: 'Z Founders Password Reset',
        html: message
    });

    res.json({ message: 'If an account exists with this email, a reset link will be sent' });
}));

/**
 * POST /api/auth/reset-password
 * Reset password with token
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
    const { token, newPassword } = req.body;
    const crypto = require('crypto');

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await prisma.user.findFirst({
        where: {
            resetPasswordToken: hashedToken,
            resetPasswordExpires: { gt: new Date() }
        }
    });

    if (!user) {
        return res.status(400).json({ error: 'Invalid or expired token' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);

    await prisma.user.update({
        where: { id: user.id },
        data: {
            passwordHash,
            resetPasswordToken: null,
            resetPasswordExpires: null
        }
    });

    res.json({ message: 'Password reset successfully' });
}));

/**
 * GET /api/auth/me
 * Get current user
 */
router.get('/me', authenticate, asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: {
            profile: {
                include: { socialLinks: true }
            },
            founderProfile: {
                include: { fundraisingDetails: true }
            },
            investorProfile: {
                include: { portfolio: true }
            },
            builderProfile: true,
            subscription: true,
            investorVerification: true,
            onboardingProgress: true
        }
    });

    res.json({ user });
}));

module.exports = router;
