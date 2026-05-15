const express = require('express');
const friendsController = require('./friendsController');
const friendRequestsController = require('./friendRequestsController');
const friendDomainController = require('./friendDomainController');
const friendSlimeInteractionsController = require('./friendSlimeInteractionsController');
const { protect } = require('../../shared/middleware/authMiddleware');
const { gameActionLimiter } = require('../../shared/middleware/rateLimiter');

const router = express.Router();

router.use(protect);

router.get('/me/friends', friendsController.listFriends);
router.post('/me/friends', gameActionLimiter, friendRequestsController.sendFriendRequest);
router.post('/me/friends/:id/accept', gameActionLimiter, friendRequestsController.acceptFriendRequest);
router.delete('/me/friends/:id', gameActionLimiter, friendRequestsController.removeFriend);

router.get('/friends/:friendUserId/domain', friendDomainController.getFriendDomain);
router.post('/friends/:friendUserId/slimes/:slimeId/feed', gameActionLimiter, friendSlimeInteractionsController.feedFriendSlime);
router.post('/friends/:friendUserId/slimes/:slimeId/poke', gameActionLimiter, friendSlimeInteractionsController.pokeFriendSlime);

module.exports = router;
