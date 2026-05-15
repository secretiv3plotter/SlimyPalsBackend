const Friendship = require('./friendshipModel');
const Slime = require('../slimes/slimeModel');
const User = require('../users/userModel');

exports.getFriendDomain = async (req, res, next) => {
  try {
    const { friendUserId } = req.params;

    const isFriend = await Friendship.findRequest(req.user.id, friendUserId);
    if (!isFriend || isFriend.status !== 'accepted') {
      return res.status(403).json({ error: { message: 'You can only view domains of accepted friends.' } });
    }

    const slimes = await Slime.findAllByUser(friendUserId);
    const friendInfo = await User.findById(friendUserId);

    res.status(200).json({
      status: 'success',
      data: {
        user: friendInfo,
        slimes
      }
    });
  } catch (err) {
    next(err);
  }
};
