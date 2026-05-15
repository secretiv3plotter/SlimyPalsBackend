const express = require('express');
const usersController = require('./usersController');
const { protect } = require('../../shared/middleware/authMiddleware');
const { gameActionLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

router.use(protect);
router.use(gameActionLimiter);

router.get('/users/search', usersController.searchByUsername);

module.exports = router;
