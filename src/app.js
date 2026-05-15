const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./features/auth/authRoutes');
const domainRoutes = require('./features/domain/domainRoutes');
const slimeRoutes = require('./features/slimes/slimeRoutes');
const foodFactoryRoutes = require('./features/foodFactory/foodFactoryRoutes');
const friendsRoutes = require('./features/friends/friendsRoutes');
const notificationRoutes = require('./features/notifications/notificationRoutes');
const syncRoutes = require('./features/sync/syncRoutes');
const usersRoutes = require('./features/users/usersRoutes');

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true
};

app.use(cors(corsOptions));
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000
});
app.use('/api/', limiter);

app.use('/api/auth', authRoutes);
app.use('/api', domainRoutes);
app.use('/api', slimeRoutes);
app.use('/api', foodFactoryRoutes);
app.use('/api', friendsRoutes);
app.use('/api', notificationRoutes);
app.use('/api', syncRoutes);
app.use('/api', usersRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: {
      message: err.message || 'Internal Server Error',
      code: err.code || 'INTERNAL_ERROR'
    }
  });
});

module.exports = app;
