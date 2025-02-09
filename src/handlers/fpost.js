const { execute } = require("./post");
const { messageInfo } = require("../utils/messageUtils");

const fpostHandler = async (ctx) => {
  const messageId = ctx.message.reply_to_message.message_id;
  const oldMessageInfo = messageInfo[messageId];

  messageInfo[messageId] = { 1: true, 2: true, 3: true };
  await execute(ctx);

  messageInfo[messageId] = oldMessageInfo;
};

module.exports = {
  command: "fpost",
  help: "Publish an approved message on the channel.",
  su: true,
  reply_to_message: true,
  execute: fpostHandler,
};
