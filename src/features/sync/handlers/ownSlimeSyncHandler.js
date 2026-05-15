const FoodFactory = require('../../foodFactory/foodFactoryModel');
const Slime = require('../../slimes/slimeModel');
const { syncError } = require('../syncErrors');
const { createDomainEvent, createOwnerEvent } = require('../realtimeEventFactory');

async function syncFeedOwnSlime({ payload, user }) {
  const slime = await Slime.findById(payload.slimeId);
  if (!slime || slime.user_id !== user.id) {
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

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
    }),
    createDomainEvent(user.id, 'domain.slime.updated', {
      slime: updatedSlime,
    }),
  ];
}

async function syncDeleteOwnSlime({ payload, user }) {
  const slime = await Slime.findById(payload.slimeId);
  if (!slime) {
    return [];
  }

  if (slime.user_id !== user.id) {
    throw syncError('SLIME_OWNER_MISMATCH');
  }

  await Slime.delete(slime.id);

  return [
    createDomainEvent(user.id, 'domain.slime.deleted', {
      slimeId: slime.id,
    }),
  ];
}

module.exports = {
  syncDeleteOwnSlime,
  syncFeedOwnSlime,
};
