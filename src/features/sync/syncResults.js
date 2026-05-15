function acceptedResult(clientActionId, realtimeEvents = []) {
  return {
    clientActionId,
    realtimeEvents: realtimeEvents.map((event) => ({
      payload: event.payload,
      type: event.type,
    })),
    status: 'accepted',
  };
}

function rejectedResult(clientActionId, errorCode) {
  return {
    clientActionId,
    error: { code: errorCode },
    status: 'rejected',
  };
}

module.exports = {
  acceptedResult,
  rejectedResult,
};
