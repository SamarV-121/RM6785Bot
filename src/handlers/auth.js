const AuthUtils = require("../utils/authUtils");

const authHandler = async (ctx) => {
  const authorized = await AuthUtils.addAuthorizedUser(
    ctx.message.reply_to_message.from
  );
  if (authorized) {
    ctx.replyToMessage(
      `@${
        ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.first_name
      } has been authorized to use the bot.`
    );
  } else {
    ctx.replyToMessage("This user is already authorized.");
  }
};

module.exports = {
  command: "auth",
  help: "Authorize a user to review and post messages to channel.",
  su: true,
  reply_to_message: true,
  execute: authHandler,
};
