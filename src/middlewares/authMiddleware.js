const { isAuthorized } = require("../utils/authUtils");

const authMiddleware = async (ctx, next) => {
  const isUserAuthorized = await isAuthorized(ctx.from.id);

  if (!isUserAuthorized) {
    return ctx.replyToMessage("You are not authorized to use this command.");
  }

  return next();
};

module.exports = authMiddleware;
