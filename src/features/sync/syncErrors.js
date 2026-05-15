function syncError(code) {
  const error = new Error(code);
  error.code = code;
  return error;
}

module.exports = {
  syncError,
};
