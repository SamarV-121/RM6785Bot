const replyToMessageMiddleware = (ctx, next) => {
  const { message } = ctx;

  if (!message.reply_to_message || !message.reply_to_message.from) {
    return ctx.replyToMessage("Please reply to a message.");
  }

  return next();
};

module.exports = replyToMessageMiddleware;
