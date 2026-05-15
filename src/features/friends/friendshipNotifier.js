const presenceManager = require('../../realtime/presenceManager');

async function notifyFriendshipAccepted(friendship, action = 'friend.request.accepted') {
  await presenceManager.refreshUsersFriends([friendship.user_id, friendship.friend_user_id]);
  presenceManager.sendFriendListChangedToUsers([friendship.user_id, friendship.friend_user_id], {
    action,
    friendshipId: friendship.id
  });
}

async function notifyFriendshipRemoved(friendship) {
  await presenceManager.refreshUsersFriends([friendship.user_id, friendship.friend_user_id]);
  presenceManager.sendFriendListChangedToUsers([friendship.user_id, friendship.friend_user_id], {
    action: friendship.status === 'pending' ? 'friend.request.removed' : 'friend.removed',
    friendshipId: friendship.id
  });
}

function notifyFriendRequestCreated(request, sender, receiver) {
  presenceManager.sendFriendListChangedToUsers([sender.id, receiver.id], {
    action: 'friend.request.received',
    friendshipId: request.id,
    senderId: sender.id,
    senderUsername: sender.username,
    receiverId: receiver.id,
    receiverUsername: receiver.username
  });
}

function notifyInteractionCreated(ownerUserId, payload) {
  const event = {
    type: 'interaction.created',
    payload: {
      ...payload,
      ownerUserId
    }
  };

  presenceManager.sendToUser(ownerUserId, event);
  presenceManager.broadcastToFriends(ownerUserId, event);
}

module.exports = {
  notifyFriendRequestCreated,
  notifyFriendshipAccepted,
  notifyFriendshipRemoved,
  notifyInteractionCreated,
};
