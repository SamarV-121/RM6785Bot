const { TELEGRAM_RM6785_CHANNEL } = require("../constants");
const { messageInfo } = require("../utils/messageUtils");

const cancleHandler = async (ctx) => {
  const messageId = ctx.message.reply_to_message.message_id;
  const msg = messageInfo[messageId];

  if (msg && msg.stickerMessageId) {
    clearTimeout(msg.timeoutId);

    // Remove the sent sticker
    ctx.telegram
      .deleteMessage(TELEGRAM_RM6785_CHANNEL, msg.stickerMessageId)
      .then(() => {
        msg.isPosted = false;
        msg.stickerMessageId = null;
        msg.sentMessageId = null;
        msg.timeoutId = null;

        ctx.replyToMessage("Successfully cancelled the scheduled post.", {
          reply_to_message_id: messageId,
        });
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    ctx.replyToMessage("No scheduled post found to cancel.", {
      reply_to_message_id: messageId,
    });
  }
};

module.exports = {
  command: "cancel",
  help: "Cancel a scheduled post. Please reply to the post you want to cancel.",
  auth: true,
  reply_to_message: true,
  execute: cancleHandler,
};
