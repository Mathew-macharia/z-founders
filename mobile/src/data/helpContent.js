/**
 * Z Founders Help Center Content
 * Curated by User Role (Lurker, Founder, Investor, Builder).
 */

export const helpTopics = [
    // =================================================================
    // 🟢 LURKER (Explorer) CONTENT
    // =================================================================
    {
        id: 'lurker-upgrade',
        roles: ['LURKER'],
        icon: 'trophy-outline',
        label: 'How to Upgrade Your Account',
        description: 'Become a Founder, Investor, or Builder',
        content: `
## Ready to Join?

You are currently browsing as a **Guest (Explorer)**. To post content, connect with others, and access full features, you need to choose a role.

### How to Upgrade
1. Go to your **Profile** tab.
2. Tap the **Premium** or **Upgrade** button.
3. Select **"Complete Profile"**.
4. Choose your path:
    *   **Founder**: To raise funding and find co-founders.
    *   **Builder**: To join startups and showcase skills.
    *   **Investor**: To find deal flow (requires verification).

### Why Upgrade?
*   **Post Content**: Share your ideas or portfolio.
*   **Message Users**: Connect directly with the ecosystem.
*   **Get Verified**: Build trust with a verified badge.
`
    },
    {
        id: 'lurker-browsing',
        roles: ['LURKER'],
        icon: 'search-outline',
        label: 'Browsing Guide',
        description: 'Tips for guests',
        content: `
## Exploring Z Founders

Even as a guest, you can discover amazing startups.

*   **Trending Feed**: See the most popular pitches of the week.
*   **Search**: Find startups by industry or keyword.
*   **Following**: You can't follow users yet, but you can remember their names!

**Note**: You cannot view private investor profiles or hidden pitches until you upgrade.
`
    },

    // =================================================================
    // 🚀 FOUNDER CONTENT
    // =================================================================
    {
        id: 'founder-pitch',
        roles: ['FOUNDER'],
        icon: 'videocam-outline',
        label: 'The Perfect Pitch',
        description: 'Rules for your Pinned Video',
        content: `
## Your Pinned Pitch 📍

This is the most important part of your profile.

### The Rules
*   **One at a time**: You can only have one active pinned pitch.
*   **90 Seconds Max**: Investors are busy. Keep it short.
*   **Vertical Video**: We are a mobile-first platform.

### Best Practices
1.  **Hook**: State the problem in the first 5 seconds.
2.  **Solution**: Show, don't just tell.
3.  **Ask**: clearly state what you need (Funding, Co-founder, Feedback).
`
    },
    {
        id: 'founder-investors',
        roles: ['FOUNDER'],
        icon: 'people-outline',
        label: 'Connecting with Investors',
        description: 'Messaging limits & Express Interest',
        content: `
## reaching Investors

We protect investors from spam to keep them on the platform.

### Messaging Limits
*   **Free Plan**: 3 cold messages to investors per month.
*   **Founder Pro**: Unlimited investor messaging.

### "Express Interest" Button
Investors can click **"Express Interest"** on your pitch.
*   You will get a notification.
*   If you accept, a chat opens (this does **not** count toward your limit).
`
    },

    // =================================================================
    // 💰 INVESTOR CONTENT
    // =================================================================
    {
        id: 'investor-verification',
        roles: ['INVESTOR'],
        icon: 'shield-checkmark-outline',
        label: 'Verification Process',
        description: 'Why and how we verify',
        content: `
## Verification

To protect founders, all investors must be verified.

### How it works
1.  **Submit Proof**: LinkedIn profile or AngelList link.
2.  **Manual Review**: Our team reviews your history (24-48h).
3.  **Approval**: Once approved, you get the Verified Investor badge.

*Until verified, your access to founders is limited.*
`
    },
    {
        id: 'investor-modes',
        roles: ['INVESTOR'],
        icon: 'eye-off-outline',
        label: 'Public vs. Stealth Mode',
        description: 'Control your visibility',
        content: `
## Privacy Modes

### Public Mode 🌍
*   Your profile is searchable.
*   Founders can find you and send cold messages (limit 3/mo).
*   Good for: Building deal flow brand.

### Stealth Mode 🕵️‍♂️ (Pro)
*   Hidden from search.
*   You are invisible until you message a founder.
*   Good for: Competitive sourcing and privacy.
`
    },

    // =================================================================
    // 🛠️ BUILDER CONTENT
    // =================================================================
    {
        id: 'builder-portfolio',
        roles: ['BUILDER'],
        icon: 'layers-outline',
        label: 'Building Your Portfolio',
        description: 'Attract founders',
        content: `
## Showcasing Work

Founders are looking for proof of utility.

*   **Link Projects**: Add URLs to your GitHub, Dribbble, or live sites.
*   **Skills**: Tag your top 5 skills accurately.
*   **Availability**: Set your status to "Looking for Project" so you appear in founder searches.
`
    },

    // =================================================================
    // 🌍 GENERAL CONTENT (ALL ROLES)
    // =================================================================
    {
        id: 'general-privacy',
        roles: ['ALL', 'FOUNDER', 'INVESTOR', 'BUILDER', 'LURKER'],
        icon: 'lock-closed-outline',
        label: 'Privacy & Security',
        description: 'Blocking, Reporting & Data',
        content: `
## Safety First

### Blocking & Reporting
*   **Block**: Settings > Privacy > Blocked Users.
*   **Report**: Tap the '...' menu on any video or profile.

### Data Rights
You can export your data or delete your account anytime from **Settings > Security**.
`
    },
    {
        id: 'general-support',
        roles: ['ALL', 'FOUNDER', 'INVESTOR', 'BUILDER', 'LURKER'],
        icon: 'help-buoy-outline',
        label: 'Contact Support',
        description: 'Get help from a human',
        content: `
## We're here to help.

Email us directly at **support@zfounders.com**.
Average response time: 24 hours.
`
    }
];
