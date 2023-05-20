const {
  messageInfo,
  timeoutIds,
  MessageUtils,
} = require("../utils/messageUtils");
const {
  POST_TIMEOUT,
  MAX_VOTES,
  TELEGRAM_STICKER_FILE_ID,
  TELEGRAM_RM6785_CHANNEL,
  TELEGRAM_RM6785_CHAT,
} = require("../constants");

const postHandler = (ctx) => {
  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.reply_to_message.message_id;
  const votes = MessageUtils.currentVotes(messageId);

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  if (messageInfo[messageId] && messageInfo[messageId].isPosted) {
    ctx.replyToMessage("This message has already been scheduled for posting.");
    return;
  }

  if (!MessageUtils.hasEnoughVotes(messageId)) {
    ctx.replyToMessage(
      `This message does not have enough approvals (${votes}/${MAX_VOTES})`
    );
    return;
  }

  messageInfo[messageId].isPosted = true;

  ctx
    .replyWithSticker(TELEGRAM_STICKER_FILE_ID, {
      reply_to_message_id: messageId,
    })
    .then((sentSticker) => {
      messageInfo[messageId].stickerMessageId = sentSticker.message_id;

      ctx.replyToMessage(`Scheduled to post in ${POST_TIMEOUT / 60000}m`, {
        reply_to_message_id: messageId,
      });

      const copyTimeout = setTimeout(() => {
        ctx
          .copyMessage(TELEGRAM_RM6785_CHANNEL, chatId, messageId)
          .then((copiedMessage) => {
            messageInfo[messageId].isPosted = false;

            ctx
              .forwardMessage(
                TELEGRAM_RM6785_CHAT,
                TELEGRAM_RM6785_CHANNEL,
                copiedMessage.message_id
              )
              .then((forwardedMsg) => {
                ctx.pinChatMessage(
                  TELEGRAM_RM6785_CHAT,
                  forwardedMsg.message_id
                );
              });
          });
      }, POST_TIMEOUT);
      timeoutIds.push(copyTimeout);
    });
};

module.exports = {
  command: "post",
  help: "Post a approved message onto the channel",
  auth: true,
  reply_to_message: true,
  execute: postHandler,
};
