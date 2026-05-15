const SYNC_ACTION_TYPES = require('../syncActionTypes');
const { syncProduceFood } = require('./foodSyncHandler');
const { syncDeleteOwnSlime, syncFeedOwnSlime } = require('./ownSlimeSyncHandler');
const { syncFeedFriendSlime, syncPokeFriendSlime } = require('./friendSlimeSyncHandler');
const { syncSummonSlime } = require('./summonSlimeSyncHandler');
const { syncError } = require('../syncErrors');

async function applyActionByType({ payload, type, user }) {
  if (payload.userId && payload.userId !== user.id) {
    throw syncError('SYNC_USER_MISMATCH');
  }

  if (type === SYNC_ACTION_TYPES.SUMMON_SLIME) {
    return syncSummonSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.PRODUCE_FOOD) {
    return syncProduceFood({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.FEED_OWN_SLIME) {
    return syncFeedOwnSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.DELETE_OWN_SLIME) {
    return syncDeleteOwnSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.FEED_FRIEND_SLIME) {
    return syncFeedFriendSlime({ payload, user });
  }

  if (type === SYNC_ACTION_TYPES.POKE_FRIEND_SLIME) {
    return syncPokeFriendSlime({ payload, user });
  }

  throw syncError('UNKNOWN_SYNC_ACTION_TYPE');
}

module.exports = {
  applyActionByType,
};
