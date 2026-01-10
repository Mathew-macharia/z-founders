const winston = require('winston');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'z-founders-api' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple()
            )
        })
    ]
});

/**
 * Request logging middleware
 */
// Request logging middleware
const requestLogger = (req, res, next) => {
    const start = Date.now();

    // Capture response body for debugging errors
    const originalSend = res.send;
    let responseBody;

    res.send = function (body) {
        responseBody = body;
        return originalSend.apply(this, arguments);
    };

    res.on('finish', () => {
        const duration = Date.now() - start;
        const meta = {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip: req.ip,
            userId: req.user?.id
        };

        if (process.env.LOG_LEVEL === 'debug') {
            meta.body = req.body;
            if (res.statusCode >= 400) {
                meta.response = responseBody;
            }
        }

        if (res.statusCode >= 400) {
            // Log 4xx/5xx as warnings/errors so they stand out
            if (res.statusCode >= 500) {
                logger.error(meta);
            } else {
                logger.warn(meta);
            }
        } else {
            logger.info(meta);
        }
    });

    next();
};

module.exports = { logger, requestLogger };
