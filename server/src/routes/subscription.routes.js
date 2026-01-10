const express = require('express');
const prisma = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');
const { authenticate } = require('../middleware/auth.middleware');

const router = express.Router();

// Subscription plans
const PLANS = {
    FREE: {
        id: 'free',
        name: 'Free',
        price: 0,
        features: [
            'Unlimited content posting',
            'Basic analytics (views, likes, comments)',
            '3 investor messages per month',
            'Standard support'
        ]
    },
    FOUNDER_PRO: {
        id: 'founder_pro',
        name: 'Founder Pro',
        monthlyPrice: parseInt(process.env.FOUNDER_PRO_MONTHLY_PRICE) || 1500,
        yearlyPrice: parseInt(process.env.FOUNDER_PRO_YEARLY_PRICE) || 14400,
        features: [
            'Everything in Free',
            'Detailed analytics (investor views, demographics)',
            'Unlimited investor messages',
            'Featured in weekly investor digest',
            'Verified badge ✓',
            'Priority support',
            'Pitch deck uploads in DMs'
        ]
    },
    INVESTOR_PRO: {
        id: 'investor_pro',
        name: 'Investor Pro',
        monthlyPrice: parseInt(process.env.INVESTOR_PRO_MONTHLY_PRICE) || 4900,
        yearlyPrice: parseInt(process.env.INVESTOR_PRO_YEARLY_PRICE) || 47000,
        features: [
            'Unlimited searches & filters',
            'Save unlimited pitches to lists',
            'Advanced filtering (traction, funding status)',
            'Early access to trending pitches',
            'Monthly curated deal flow report',
            'Request warm intros to founders'
        ]
    },
    STEALTH_MODE: {
        id: 'stealth_mode',
        name: 'Stealth Mode',
        monthlyPrice: parseInt(process.env.STEALTH_MODE_MONTHLY_PRICE) || 2900,
        features: [
            'Profile not discoverable in search',
            'Share unlisted pitch links',
            'All Founder Pro features',
            'For competitive spaces'
        ]
    }
};

/**
 * GET /api/subscriptions/plans
 * Get available subscription plans
 */
router.get('/plans', asyncHandler(async (req, res) => {
    res.json({ plans: PLANS });
}));

/**
 * GET /api/subscriptions/status
 * Get current subscription status
 */
router.get('/status', authenticate, asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id }
    });

    if (!subscription) {
        return res.json({
            tier: 'FREE',
            plan: PLANS.FREE,
            active: true
        });
    }

    const isActive = subscription.tier === 'FREE' ||
        (subscription.currentPeriodEnd && new Date(subscription.currentPeriodEnd) > new Date());

    res.json({
        tier: subscription.tier,
        plan: PLANS[subscription.tier],
        active: isActive,
        currentPeriodStart: subscription.currentPeriodStart,
        currentPeriodEnd: subscription.currentPeriodEnd,
        canceledAt: subscription.canceledAt
    });
}));

/**
 * POST /api/subscriptions
 * Create subscription (Stripe integration placeholder)
 */
router.post('/', authenticate, asyncHandler(async (req, res) => {
    const { planId, interval = 'monthly' } = req.body;

    const validPlans = ['founder_pro', 'investor_pro', 'stealth_mode'];
    if (!validPlans.includes(planId)) {
        return res.status(400).json({ error: 'Invalid plan' });
    }

    // Map plan ID to tier
    const tierMap = {
        'founder_pro': 'FOUNDER_PRO',
        'investor_pro': 'INVESTOR_PRO',
        'stealth_mode': 'STEALTH_MODE'
    };

    const tier = tierMap[planId];
    const plan = PLANS[tier];

    // In production, this would create a Stripe checkout session
    // For now, simulate subscription creation

    const periodEnd = interval === 'yearly'
        ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
        : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const subscription = await prisma.subscription.upsert({
        where: { userId: req.user.id },
        create: {
            userId: req.user.id,
            tier,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            // stripeCustomerId and stripeSubId would come from Stripe
        },
        update: {
            tier,
            currentPeriodStart: new Date(),
            currentPeriodEnd: periodEnd,
            canceledAt: null
        }
    });

    res.json({
        message: 'Subscription created successfully',
        subscription,
        // In production:
        // checkoutUrl: stripeSession.url
        note: 'In production, this would redirect to Stripe checkout'
    });
}));

/**
 * DELETE /api/subscriptions
 * Cancel subscription
 */
router.delete('/', authenticate, asyncHandler(async (req, res) => {
    const subscription = await prisma.subscription.findUnique({
        where: { userId: req.user.id }
    });

    if (!subscription || subscription.tier === 'FREE') {
        return res.status(400).json({ error: 'No active subscription to cancel' });
    }

    // In production, this would cancel via Stripe
    await prisma.subscription.update({
        where: { userId: req.user.id },
        data: {
            canceledAt: new Date()
            // Subscription remains active until currentPeriodEnd
        }
    });

    res.json({
        message: 'Subscription will be canceled at end of billing period',
        endsAt: subscription.currentPeriodEnd
    });
}));

/**
 * POST /api/subscriptions/webhook
 * Stripe webhook handler (placeholder)
 */
router.post('/webhook', express.raw({ type: 'application/json' }), asyncHandler(async (req, res) => {
    // In production, verify Stripe signature and handle events
    // const sig = req.headers['stripe-signature'];
    // const event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);

    // Events to handle:
    // - checkout.session.completed
    // - customer.subscription.updated
    // - customer.subscription.deleted
    // - invoice.payment_failed

    res.json({ received: true });
}));

module.exports = router;
