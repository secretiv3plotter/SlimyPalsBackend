function createDomainEvent(userId, type, payload = {}) {
  return {
    audience: 'domain',
    type,
    userId,
    payload: {
      ...payload,
      userId,
    },
  };
}

function createOwnerEvent(userId, type, payload = {}) {
  return {
    audience: 'owner',
    type,
    userId,
    payload: {
      ...payload,
      userId,
    },
  };
}

module.exports = {
  createDomainEvent,
  createOwnerEvent,
};
