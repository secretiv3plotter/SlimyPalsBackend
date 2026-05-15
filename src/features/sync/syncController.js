const { applyActions } = require('./syncActionProcessor');

exports.syncActions = async (req, res, next) => {
  try {
    const actions = Array.isArray(req.body.actions) ? req.body.actions : [];
    const { accepted, rejected } = await applyActions(actions, req.user);

    res.status(200).json({ accepted, rejected });
  } catch (err) {
    next(err);
  }
};
