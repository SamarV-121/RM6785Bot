const { removeAuthorizedUser } = require("../utils/authUtils");

const handleRmAuthCommand = async (ctx) => {
  const removed = await removeAuthorizedUser(
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

module.exports = handleRmAuthCommand;
