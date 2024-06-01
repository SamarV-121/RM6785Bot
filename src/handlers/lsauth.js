const AuthUtils = require("../utils/authUtils");

const lsauthHandler = async (ctx) => {
  const authorizedUsers = await AuthUtils.getAuthorizedUsers();
  let message = "Authorized users:\n";
  authorizedUsers.forEach((user) => {
    message += `[${user.name}](tg://user?id=${user.id})\n`;
  });
  ctx.telegram.sendMessage(ctx.chat.id, message, { parse_mode: "Markdown" });
};

module.exports = {
  command: "lsauth",
  help: "List all authorized users who can post messages on the channel.",
  execute: lsauthHandler,
};
