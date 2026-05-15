const presenceManager = require('../../realtime/presenceManager');

function emitSyncRealtimeEvents(events = []) {
  events.forEach((event) => {
    if (!event) return;

    const message = {
      type: event.type,
      payload: event.payload,
    };

    presenceManager.sendToUser(event.userId, message);

    if (event.audience === 'domain') {
      presenceManager.broadcastToFriends(event.userId, message);
    }
  });
}

module.exports = {
  emitSyncRealtimeEvents,
};
