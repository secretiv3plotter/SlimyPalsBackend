const Friendship = require('./friendshipModel');
const User = require('../users/userModel');
const { MAX_FRIENDS } = require('./friendshipPolicy');
const {
  notifyFriendRequestCreated,
  notifyFriendshipAccepted,
  notifyFriendshipRemoved,
} = require('./friendshipNotifier');

exports.sendFriendRequest = async (req, res, next) => {
  try {
    const username = (req.body.username || '').trim();
    const userId = (req.body.userId || req.body.friendUserId || req.body.targetUserId || req.body.id || '').trim();

    if (!username && !userId) {
      return res.status(400).json({
        error: {
          message: 'Username or userId is required',
          code: 'FRIEND_TARGET_REQUIRED'
        }
      });
    }

    const targetUser = userId
      ? await User.findById(userId)
      : await User.findByUsername(username);

    if (!targetUser) {
      return res.status(404).json({
        error: {
          message: 'User not found',
          code: 'FRIEND_USER_NOT_FOUND'
        }
      });
    }

    if (targetUser.id === req.user.id) {
      return res.status(400).json({
        error: {
          message: 'You cannot friend yourself',
          code: 'CANNOT_FRIEND_SELF'
        }
      });
    }

    const currentFriendsCount = await Friendship.countAccepted(req.user.id);
    if (currentFriendsCount >= MAX_FRIENDS) {
      return res.status(400).json({
        error: {
          message: 'You have reached the maximum of 4 friends.',
          code: 'FRIEND_LIMIT_REACHED'
        }
      });
    }

    const existing = await Friendship.findRequest(req.user.id, targetUser.id);
    if (existing) {
      if (existing.status === 'accepted') {
        return res.status(200).json({
          status: 'success',
          data: { friendship: existing, alreadyFriends: true }
        });
      }

      if (existing.friend_user_id === req.user.id) {
        const acceptResult = await Friendship.acceptWithFriendLimit(existing.id, req.user.id, MAX_FRIENDS);
        if (acceptResult.status === 'friend_limit') {
          return res.status(400).json({
            error: {
              message: 'Both users need space for another friend before accepting.',
              code: 'FRIEND_LIMIT_REACHED'
            }
          });
        }

        if (acceptResult.status === 'not_found') {
          return res.status(404).json({
            error: {
              message: 'Friend request not found or not for you',
              code: 'FRIENDSHIP_UNAVAILABLE'
            }
          });
        }

        await notifyFriendshipAccepted(acceptResult.friendship, 'friend.request.auto_accepted');

        return res.status(200).json({
          status: 'success',
          data: { friendship: acceptResult.friendship, autoAccepted: true }
        });
      }

      return res.status(200).json({
        status: 'success',
        data: { request: existing, alreadySent: true }
      });
    }

    const request = await Friendship.create(req.user.id, targetUser.id);

    notifyFriendRequestCreated(request, req.user, targetUser);

    res.status(201).json({
      status: 'success',
      data: { request }
    });
  } catch (err) {
    next(err);
  }
};

exports.acceptFriendRequest = async (req, res, next) => {
  try {
    const { id } = req.params;

    const acceptResult = await Friendship.acceptWithFriendLimit(id, req.user.id, MAX_FRIENDS);
    if (acceptResult.status === 'friend_limit') {
      return res.status(400).json({
        error: {
          message: 'Both users need space for another friend before accepting.',
          code: 'FRIEND_LIMIT_REACHED'
        }
      });
    }

    if (acceptResult.status === 'not_found') {
      return res.status(404).json({
        error: {
          message: 'Friend request not found or not for you',
          code: 'FRIENDSHIP_UNAVAILABLE'
        }
      });
    }

    await notifyFriendshipAccepted(acceptResult.friendship);

    res.status(200).json({
      status: 'success',
      data: { friendship: acceptResult.friendship }
    });
  } catch (err) {
    next(err);
  }
};

exports.removeFriend = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await Friendship.remove(id, req.user.id);
    
    if (!result) {
      return res.status(404).json({
        error: {
          message: 'Friendship not found',
          code: 'FRIENDSHIP_UNAVAILABLE'
        }
      });
    }

    await notifyFriendshipRemoved(result);

    res.status(204).send();
  } catch (err) {
    next(err);
  }
};
