const sgMail = require('@sendgrid/mail');

// Initialize SendGrid if key is present
if (process.env.SENDGRID_API_KEY) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Send an email using SendGrid or console log in development
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @returns {Promise<boolean>} - Success status
 */
const sendEmail = async ({ to, subject, html }) => {
    try {
        // Development mode or missing key
        if (!process.env.SENDGRID_API_KEY) {
            console.log('---------------------------------------------------');
            console.log('📧 [EMAIL MOCK] Service would send email to:', to);
            console.log('Subject:', subject);
            console.log('Content Preview:', html.substring(0, 100) + '...');
            console.log('---------------------------------------------------');
            return true;
        }

        const msg = {
            to,
            from: 'no-reply@zfounders.com', // Must be verified sender
            subject,
            html,
        };

        await sgMail.send(msg);
        console.log(`📧 Email sent to ${to}`);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        if (error.response) {
            console.error(error.response.body);
        }
        return false;
    }
};

module.exports = {
    sendEmail
};
