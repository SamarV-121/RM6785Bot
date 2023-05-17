const { getAuthorizedUsers } = require("../utils/authUtils");

const handleLsAuthCommand = async (ctx) => {
  const authorizedUsers = await getAuthorizedUsers();
  let message = "Authorized users:\n";
  authorizedUsers.forEach((user) => {
    message += `[${user.name}](tg://user?id=${user.id})\n`;
  });
  ctx.replyWithMarkdown(message, {
    reply_to_message_id: ctx.message.message_id,
  });
};

const helpMessage = "/lsauth - List authorized users";

module.exports = { handleLsAuthCommand, helpMessage };
