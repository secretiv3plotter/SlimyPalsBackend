const SyncAction = require('./syncActionModel');
const { applyActionByType } = require('./handlers');
const { emitSyncRealtimeEvents } = require('./realtimeEventEmitter');
const { acceptedResult, rejectedResult } = require('./syncResults');

async function applyActions(actions, user) {
  const accepted = [];
  const rejected = [];

  for (const action of actions) {
    const result = await applySyncAction(action, user);

    if (result.status === 'accepted') {
      accepted.push(result);
    } else {
      rejected.push(result);
    }
  }

  return { accepted, rejected };
}

async function applySyncAction(action, user) {
  const clientActionId = action?.clientActionId || action?.id || action?.client_action_id;
  const type = action?.type;
  const payload = action?.payload || {};

  if (!clientActionId) {
    return rejectedResult(null, 'SYNC_ACTION_ID_REQUIRED');
  }

  const existing = await SyncAction.find(clientActionId, user.id);
  if (existing) {
    return existing.status === 'accepted'
      ? acceptedResult(clientActionId)
      : rejectedResult(clientActionId, existing.error_code || 'SYNC_ACTION_REJECTED');
  }

  try {
    const realtimeEvents = await applyActionByType({ payload, type, user });
    await SyncAction.create({ clientActionId, status: 'accepted', userId: user.id });
    emitSyncRealtimeEvents(realtimeEvents);
    return acceptedResult(clientActionId, realtimeEvents);
  } catch (error) {
    const errorCode = error.code || 'SYNC_ACTION_FAILED';
    await SyncAction.create({
      clientActionId,
      errorCode,
      status: 'rejected',
      userId: user.id,
    });
    return rejectedResult(clientActionId, errorCode);
  }
}

module.exports = {
  applyActions,
};
