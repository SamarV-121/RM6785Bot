import type { BotContext, HandlerDescriptor } from "../types";
import {
  messageInfo,
  hasEnoughVotes,
  currentVotes,
} from "../utils/messageUtils";
import {
  POST_TIMEOUT,
  MAX_VOTES,
  TELEGRAM_STICKER_FILE_ID,
  TELEGRAM_RM6785_CHANNEL,
  TELEGRAM_RM6785_CHAT,
  TELEGRAM_R7_CHAT,
} from "../constants";
import { replyToMessage } from "../utils/contextUtils";

const postHandler = async (ctx: BotContext) => {
  if (!ctx.message.reply_to_message || !ctx.message.text) return;

  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.reply_to_message.message_id;
  const votes = currentVotes(messageId);
  const timeoutMatch = ctx.message.text?.match(/\d+(\.\d+)?m/);
  let timeoutInMs = POST_TIMEOUT;
  if (timeoutMatch) {
    const timeoutInMinutes = parseFloat(timeoutMatch[0].replace(/m$/, ""));
    timeoutInMs = timeoutInMinutes * 60000;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  const msg = messageInfo[messageId];

  if (msg.isPosted) {
    await replyToMessage(
      ctx,
      "This message has already been scheduled for posting."
    );
    return;
  }

  if (!hasEnoughVotes(messageId)) {
    await replyToMessage(
      ctx,
      `This message does not have enough approvals (${votes}/${MAX_VOTES})`
    );
    return;
  }

  msg.isPosted = true;

  try {
    const sentStickerPromise = ctx.bot.sendSticker(
      TELEGRAM_RM6785_CHANNEL,
      TELEGRAM_STICKER_FILE_ID
    );
    const countdownPromise = ctx.bot.sendMessage(
      TELEGRAM_RM6785_CHANNEL,
      `Something incoming! Scheduled in <b>${timeoutInMs / 60000}m</b>`,
      {
        parse_mode: "html",
      }
    );

    const [sentSticker, countdown] = await Promise.all([
      sentStickerPromise,
      countdownPromise,
    ]);

    msg.stickerMessageId = sentSticker.message_id;
    msg.countdownMessageId = countdown.message_id;

    const sentMessage = await replyToMessage(
      ctx,
      `Scheduled to post in ${timeoutInMs / 60000}m`
    );
    const sentMessageId = sentMessage.message_id;

    let secondsLeft = Math.floor(timeoutInMs / 1000);

    const countdownTimeout = async () => {
      if (secondsLeft % 5 === 0) {
        const minutes = Math.floor(secondsLeft / 60);
        const seconds = secondsLeft % 60;
        const a = ctx.bot.editMessageText({
          chat_id: chatId,
          message_id: sentMessageId,
          text: `Scheduled to post in ${minutes}m ${seconds}s`,
        });
        const b = ctx.bot.editMessageText({
          chat_id: TELEGRAM_RM6785_CHANNEL,
          message_id: countdown.message_id,
          text: `Something incoming! Scheduled in <b>${minutes}m ${seconds}s</b>`,
          parse_mode: "html",
        });
        await Promise.all([a, b]);
      }

      if (secondsLeft <= 0) {
        const deletePromise = ctx.bot.deleteMessage(
          TELEGRAM_RM6785_CHANNEL,
          countdown.message_id
        );
        const copiedMessagePromise = ctx.bot.copyMessage(
          TELEGRAM_RM6785_CHANNEL,
          chatId,
          messageId
        );

        const [_, copiedMessage] = await Promise.all([
          deletePromise,
          copiedMessagePromise,
        ]);

        msg.isPosted = false;

        await ctx.bot.editMessageText({
          chat_id: chatId,
          message_id: sentMessageId,
          text: "Posted successfully!",
        });

        try {
          const forwardAndPin = async (fromChat: number, toChat: number) => {
            const forwardedMsg = await ctx.bot.forwardMessage(
              toChat,
              fromChat,
              copiedMessage.message_id
            );
            await ctx.bot.pinChatMessage(toChat, forwardedMsg.message_id);
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

const handler: HandlerDescriptor = {
  command: "post",
  help: "Publish an approved message on the channel.",
  auth: true,
  reply_to_message: true,
  execute: postHandler,
};

export { handler };
