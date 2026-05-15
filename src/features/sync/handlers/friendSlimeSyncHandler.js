const FoodFactory = require('../../foodFactory/foodFactoryModel');
const Friendship = require('../../friends/friendshipModel');
const Interaction = require('../../interactions/interactionModel');
const Slime = require('../../slimes/slimeModel');
const { syncError } = require('../syncErrors');
const { createDomainEvent, createOwnerEvent } = require('../realtimeEventFactory');

async function syncFeedFriendSlime({ payload, user }) {
  const { friendUserId, slimeId } = payload;
  await assertAcceptedFriendship(user.id, friendUserId);

  const slime = await Slime.findById(slimeId);
  if (!slime || slime.user_id !== friendUserId) {
    throw syncError('SLIME_UNAVAILABLE');
  }

  if (slime.level >= 3) {
    return;
  }

  const factory = await FoodFactory.findByUserId(user.id);
  if (!factory || factory.quantity <= 0) {
    throw syncError('NO_FOOD_AVAILABLE');
  }

  const foodFactoryStock = await FoodFactory.updateStock(user.id, -1);
  const updatedSlime = await Slime.update(slime.id, {
    level: slime.level + 1,
    last_fed_at: new Date(),
  });
  const interaction = await Interaction.log({
    actionType: 'feed',
    senderId: user.id,
    targetSlimeId: slime.id,
  });

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
    }),
    createDomainEvent(friendUserId, 'domain.slime.updated', {
      slime: updatedSlime,
    }),
    createDomainEvent(friendUserId, 'interaction.created', {
      actionType: 'feed',
      interaction,
      ownerUserId: friendUserId,
      senderId: user.id,
      senderUsername: user.username,
      slimeId: slime.id,
    }),
  ];
}

async function syncPokeFriendSlime({ payload, user }) {
  const { friendUserId, slimeId } = payload;
  await assertAcceptedFriendship(user.id, friendUserId);

  const slime = await Slime.findById(slimeId);
  if (!slime || slime.user_id !== friendUserId) {
    throw syncError('SLIME_UNAVAILABLE');
  }

  const interaction = await Interaction.log({
    actionType: 'poke',
    senderId: user.id,
    targetSlimeId: slime.id,
  });

  return [
    createDomainEvent(friendUserId, 'interaction.created', {
      actionType: 'poke',
      interaction,
      ownerUserId: friendUserId,
      senderId: user.id,
      senderUsername: user.username,
      slimeId: slime.id,
    }),
  ];
}

async function assertAcceptedFriendship(userId, friendUserId) {
  const friendship = await Friendship.findRequest(userId, friendUserId);
  if (!friendship || friendship.status !== 'accepted') {
    throw syncError('FRIENDSHIP_UNAVAILABLE');
  }
}

module.exports = {
  syncFeedFriendSlime,
  syncPokeFriendSlime,
};
