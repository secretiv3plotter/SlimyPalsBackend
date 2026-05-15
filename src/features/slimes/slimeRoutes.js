const express = require('express');
const slimeController = require('./slimeController');
const { protect } = require('../../shared/middleware/authMiddleware');
const { gameActionLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/slimes', slimeController.listMySlimes);
router.post('/me/slimes/summon', gameActionLimiter, slimeController.summonSlime);
router.post('/me/slimes/:id/feed', gameActionLimiter, slimeController.feedSlime);
router.delete('/me/slimes/:id', gameActionLimiter, slimeController.deleteSlime);

module.exports = router;
