const Friendship = require('./friendshipModel');
const Slime = require('../slimes/slimeModel');
const FoodFactory = require('../foodFactory/foodFactoryModel');
const Interaction = require('../interactions/interactionModel');
const presenceManager = require('../../realtime/presenceManager');
const db = require('../../infrastructure/db');
const { notifyInteractionCreated } = require('./friendshipNotifier');

exports.feedFriendSlime = async (req, res, next) => {
  try {
    const { friendUserId, slimeId } = req.params;

    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only feed slimes of accepted friends.' } });
    }

    const slime = await Slime.findById(slimeId);
    if (!slime || slime.user_id !== friendUserId) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    if (slime.level >= 3) {
      return res.status(400).json({ error: { message: 'Slime is already an adult' } });
    }

    if (slime.last_fed_at) {
      const lastFed = new Date(slime.last_fed_at);
      const now = new Date();
      if ((now - lastFed) / (1000 * 60 * 60) < 6) {
        return res.status(400).json({ error: { message: 'Slime is not hungry yet' } });
      }
    }

    const myFactory = await FoodFactory.findByUserId(req.user.id);
    if (!myFactory || myFactory.quantity <= 0) {
      return res.status(400).json({ error: { message: 'You have no food left to share' } });
    }

    await db.query('BEGIN');
    try {
      const updatedFactory = await FoodFactory.updateStock(req.user.id, -1);
      const updatedSlime = await Slime.update(slimeId, {
        level: slime.level + 1,
        last_fed_at: new Date()
      });
      
      const interaction = await Interaction.log({
        senderId: req.user.id,
        targetSlimeId: slimeId,
        actionType: 'feed'
      });

      await db.query('COMMIT');

      presenceManager.broadcastToFriends(friendUserId, {
        type: 'domain.slime.updated',
        payload: {
          slime: updatedSlime,
          userId: friendUserId
        }
      });
      presenceManager.sendToUser(req.user.id, {
        type: 'domain.food.updated',
        payload: {
          foodFactoryStock: updatedFactory,
          userId: req.user.id
        }
      });

      presenceManager.sendToUser(friendUserId, {
        type: 'domain.slime.updated',
        payload: {
          slime: updatedSlime,
          slimeId,
          senderId: req.user.id,
          senderUsername: req.user.username,
          userId: friendUserId,
          newLevel: updatedSlime.level
        }
      });
      notifyInteractionCreated(friendUserId, {
        actionType: 'feed',
        interaction,
        senderId: req.user.id,
        senderUsername: req.user.username,
        slimeId
      });
      
      res.status(200).json({
        status: 'success',
        data: {
          factory: updatedFactory,
          slime: updatedSlime
        }
      });
    } catch (err) {
      await db.query('ROLLBACK');
      throw err;
    }
  } catch (err) {
    next(err);
  }
};

exports.pokeFriendSlime = async (req, res, next) => {
  try {
    const { friendUserId, slimeId } = req.params;

    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only poke slimes of accepted friends.' } });
    }

    const slime = await Slime.findById(slimeId);
    if (!slime || slime.user_id !== friendUserId) {
      return res.status(404).json({ error: { message: 'Slime not found' } });
    }

    const interaction = await Interaction.log({
      senderId: req.user.id,
      targetSlimeId: slimeId,
      actionType: 'poke'
    });

    notifyInteractionCreated(friendUserId, {
      actionType: 'poke',
      interaction,
      senderId: req.user.id,
      senderUsername: req.user.username,
      slimeId
    });

    res.status(200).json({
      status: 'success',
      data: { interaction },
      message: 'Poked!'
    });
  } catch (err) {
    next(err);
  }
};
