const AuthUtils = require("../utils/authUtils");

const rmauthHandler = async (ctx) => {
  const removed = await AuthUtils.removeAuthorizedUser(
    ctx.message.reply_to_message.from.id
  );
  if (removed) {
    ctx.replyToMessage(
      `@${
        ctx.message.reply_to_message.from.username ||
        ctx.message.reply_to_message.from.first_name
      } has been removed from the authorized users.`
    );
  } else {
    ctx.replyToMessage("This user is not in the authorized users list.");
  }
};

module.exports = {
  command: "rmauth",
  help: "Unauthorize a user from using the /post command.",
  su: true,
  reply_to_message: true,
  execute: rmauthHandler,
};
