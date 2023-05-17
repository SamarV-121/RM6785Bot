const { addAuthorizedUser } = require("../utils/authUtils");

const handleAuthCommand = async (ctx) => {
  const authorized = await addAuthorizedUser(ctx.message.reply_to_message.from);
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

const helpMessage =
  "/auth - Authorize a user review and post messages to channel";

module.exports = { handleAuthCommand, helpMessage };
