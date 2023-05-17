const { timeoutIds, messageInfo } = require("../utils/messageUtils");

const handleCancelCommand = (ctx) => {
  const { message } = ctx;
  const chatId = message.chat.id;
  const messageId = message.reply_to_message.message_id;

  const voteData = messageInfo[messageId];
  if (voteData && voteData.stickerMessageId) {
    clearTimeout(voteData.copyTimeout);

    const timeoutIndex = timeoutIds.indexOf(voteData.copyTimeout);
    if (timeoutIndex !== -1) {
      timeoutIds.splice(timeoutIndex, 1);
    }

    ctx.telegram.deleteMessage(chatId, voteData.stickerMessageId).then(() => {
      ctx.replyToMessage("Successfully cancelled the recent scheduled post.", {
        reply_to_message_id: messageId,
      });
    });
  } else {
    ctx.replyToMessage("No scheduled post found to cancel.", {
      reply_to_message_id: messageId,
    });
  }
};

const helpMessage =
  "/cancel - Cancel the scheduled post (reply to post which you want to cancel)";

module.exports = { handleCancelCommand, helpMessage };
