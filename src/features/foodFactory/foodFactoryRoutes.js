const express = require('express');
const foodFactoryController = require('./foodFactoryController');
const { protect } = require('../../shared/middleware/authMiddleware');
const { gameActionLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/food-factory', foodFactoryController.getFoodFactory);
router.post('/me/food-factory/produce', gameActionLimiter, foodFactoryController.produceFood);

module.exports = router;
