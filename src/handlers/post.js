const { messageInfo, MessageUtils } = require("../utils/messageUtils");
const {
  POST_TIMEOUT,
  MAX_VOTES,
  TELEGRAM_STICKER_FILE_ID,
  TELEGRAM_RM6785_CHANNEL,
  TELEGRAM_RM6785_CHAT,
  TELEGRAM_R7_CHAT,
} = require("../constants");

const postHandler = async (ctx) => {
  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.reply_to_message.message_id;
  const votes = MessageUtils.currentVotes(messageId);
  const timeoutMatch = ctx.message.text?.match(/\/post (\d+)m/);
  let timeoutInMs = POST_TIMEOUT;
  if (timeoutMatch) {
    const timeoutInMinutes = timeoutMatch[1];
    timeoutInMs = timeoutInMinutes * 60000;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  const msg = messageInfo[messageId];

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

  msg.isPosted = true;

  try {
    const sentSticker = await ctx.telegram.sendSticker(
      TELEGRAM_RM6785_CHANNEL,
      TELEGRAM_STICKER_FILE_ID
    );

    msg.stickerMessageId = sentSticker.message_id;

    const sentMessage = await ctx.replyToMessage(
      `Scheduled to post in ${timeoutInMs / 60000}m`
    );
    const sentMessageId = sentMessage.message_id;

    let secondsLeft = Math.floor(timeoutInMs / 1000);

    const countdownTimeout = async () => {
      if (secondsLeft % 5 === 0) {
        await ctx.telegram.editMessageText(
          chatId,
          sentMessageId,
          null,
          `Scheduled to post in ${Math.floor(secondsLeft / 60)}m ${
            secondsLeft % 60
          }s`
        );
      }

      if (secondsLeft <= 0) {
        const copiedMessage = await ctx.telegram.copyMessage(
          TELEGRAM_RM6785_CHANNEL,
          chatId,
          messageId
        );

        msg.isPosted = false;

        await ctx.telegram.editMessageText(
          chatId,
          sentMessageId,
          null,
          "Posted successfully!"
        );

        try {
          const forwardAndPin = async (fromChat, toChat) => {
            const forwardedMsg = await ctx.telegram.forwardMessage(
              toChat,
              fromChat,
              copiedMessage.message_id
            );
            await ctx.telegram.pinChatMessage(toChat, forwardedMsg.message_id);
          };

          await forwardAndPin(TELEGRAM_RM6785_CHANNEL, TELEGRAM_RM6785_CHAT);
          await forwardAndPin(TELEGRAM_RM6785_CHANNEL, TELEGRAM_R7_CHAT);
        } catch (error) {
          console.error(error);
        }
      } else {
        msg.timeoutId = setTimeout(countdownTimeout, 1000);
      }

      secondsLeft -= 1;
    };

    const timeoutId = setTimeout(countdownTimeout, 1000);
    msg.timeoutId = timeoutId;
  } catch (error) {
    console.error(error);
  }
};

module.exports = {
  command: "post",
  help: "Publish an approved message on the channel.",
  auth: true,
  reply_to_message: true,
  execute: postHandler,
};
