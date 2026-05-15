const FoodFactory = require('../../foodFactory/foodFactoryModel');
const Slime = require('../../slimes/slimeModel');
const { syncError } = require('../syncErrors');
const { createOwnerEvent } = require('../realtimeEventFactory');

async function syncProduceFood({ payload, user }) {
  const producedQuantity = Number(payload.producedQuantity);

  if (!Number.isFinite(producedQuantity) || producedQuantity <= 0) {
    throw syncError('PRODUCE_FOOD_PAYLOAD_INCOMPLETE');
  }

  const activeSlimeCount = await Slime.countActiveByUser(user.id);
  if (activeSlimeCount <= 0) {
    throw syncError('NO_ACTIVE_SLIMES');
  }

  const amount = Math.min(producedQuantity, activeSlimeCount);
  const foodFactoryStock = await FoodFactory.produce(user.id, amount);

  return [
    createOwnerEvent(user.id, 'domain.food.updated', {
      foodFactoryStock,
      producedQuantity: amount,
    }),
  ];
}

module.exports = {
  syncProduceFood,
};
