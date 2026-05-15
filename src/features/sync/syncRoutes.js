const express = require('express');
const syncController = require('./syncController');
const { protect } = require('../../shared/middleware/authMiddleware');
const { gameActionLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.post('/sync/actions', syncController.syncActions);

module.exports = router;
