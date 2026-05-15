const Friendship = require('./friendshipModel');
const presenceManager = require('../../realtime/presenceManager');

exports.listFriends = async (req, res, next) => {
  try {
    const friends = await Friendship.findFriends(req.user.id);
    const pending = await Friendship.findPendingRequests(req.user.id);
    const sent = await Friendship.findSentRequests(req.user.id);
    
    res.status(200).json({
      status: 'success',
      data: { 
        friends: friends.map(friend => ({
          ...friend,
          online: presenceManager.isUserOnline(friend.friend_id)
        })),
        pending,
        sent
      }
    });
  } catch (err) {
    next(err);
  }
};
