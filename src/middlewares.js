const AuthUtils = require("./utils/authUtils");
const { TELEGRAM_SU_ID } = require("./constants");

const Middleware = {};

/**
 * Middleware to check if the user is superuser.
 * @param {object} ctx - The context object containing information about the Telegram update.
 * @param {function} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} - A promise that resolves once the middleware is executed.
 */
Middleware.suMiddleware = async (ctx, next) => {
  const userId = ctx.from.id;

  if (!TELEGRAM_SU_ID.includes(userId)) {
    return ctx.replyToMessage("You are not authorized to use this command.");
  }

  return next();
};

/**
 * Middleware to check if the user is authorized.
 * @param {object} ctx - The context object containing information about the Telegram update.
 * @param {function} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} - A promise that resolves once the middleware is executed.
 */
Middleware.authMiddleware = async (ctx, next) => {
  const isUserAuthorized = await AuthUtils.isAuthorized(ctx.from.id);

  if (!isUserAuthorized) {
    return ctx.replyToMessage("You are not authorized to use this command.");
  }

  return next();
};

/**
 * Middleware to check if the message is a reply.
 * @param {object} ctx - The context object containing information about the Telegram update.
 * @param {function} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} - A promise that resolves once the middleware is executed.
 */
Middleware.replyToMessageMiddleware = async (ctx, next) => {
  const { message } = ctx;

  if (!message.reply_to_message || !message.reply_to_message.from) {
    return ctx.replyToMessage("Please reply to a message.");
  }

  return next();
};

/**
 * Middleware to check if the message has data provided.
 * @param {object} ctx - The context object containing information about the Telegram update.
 * @param {function} next - The next function to call in the middleware chain.
 * @returns {Promise<void>} - A promise that resolves once the middleware is executed.
 */
Middleware.checkDataMiddleware = async (ctx, next) => {
  const msgText = ctx.message.text.split(" ");

  if (!msgText[1]) {
    return ctx.replyToMessage("No data is provided");
  }

  return next();
};

module.exports = Middleware;
