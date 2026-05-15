const rateLimit = require('express-rate-limit');

exports.apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message: {
    error: {
      message: 'Too many requests from this IP, please try again after 15 minutes',
      code: 'TOO_MANY_REQUESTS'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: {
      message: 'Too many authentication attempts, please try again after an hour',
      code: 'AUTH_THROTTLED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});

exports.gameActionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 60,
  message: {
    error: {
      message: 'Take it slow! You are clicking too fast.',
      code: 'ACTION_THROTTLED'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
