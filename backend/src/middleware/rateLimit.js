const rateLimit = require('express-rate-limit');

const aiRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 menit
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Too many AI requests. Please wait a moment before trying again.',
        retryAfter: 60
    }
});

module.exports = { aiRateLimiter };
