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
import type { Message } from "node-telegram-bot-api";
import { parsePostAndConstructRichMarkdown } from "../utils/postParser";

const postrichHandler = async (ctx: BotContext) => {
  if (!ctx.message.reply_to_message || !ctx.message.text) return;

  const chatId = ctx.message.chat.id;
  const messageId = ctx.message.reply_to_message.message_id;
  const votes = currentVotes(messageId);
  const mText = ctx.message.text?.split(" ");
  if (mText.length < 3) {
    await replyToMessage(ctx, "Not enough arg");
    return;
  }
  const timeoutMatch = mText[1].match(/\d+(\.\d+)?m/);
  let timeoutInMs = POST_TIMEOUT;
  if (timeoutMatch) {
    const timeoutInMinutes = parseFloat(timeoutMatch[1]);
    timeoutInMs = timeoutInMinutes * 60000;
  }
  const bannerLink = mText[2];

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
    const sentSticker = await ctx.bot.sendSticker(
      TELEGRAM_RM6785_CHANNEL,
      TELEGRAM_STICKER_FILE_ID
    );

    msg.stickerMessageId = sentSticker.message_id;

    const sentMessage = await replyToMessage(
      ctx,
      `Scheduled to post in ${timeoutInMs / 60000}m`
    );
    const sentMessageId = sentMessage.message_id;

    let secondsLeft = Math.floor(timeoutInMs / 1000);

    const countdownTimeout = async (m: Message) => {
      if (secondsLeft % 5 === 0) {
        await ctx.bot.editMessageText(
          `Scheduled to post in ${Math.floor(secondsLeft / 60)}m ${
            secondsLeft % 60
          }s`,
          {
            chat_id: chatId,
            message_id: sentMessageId,
          }
        );
      }

      if (secondsLeft <= 0) {
        console.log(m);
        const richMarkdown = parsePostAndConstructRichMarkdown(m, bannerLink);
        if (!richMarkdown) return;

        const sentPostMessage = await ctx.bot.sendRichMessage(
          TELEGRAM_RM6785_CHANNEL,
          {
            markdown: richMarkdown,
          }
        );

        msg.isPosted = false;

        await ctx.bot.editMessageText("Posted successfully!", {
          chat_id: chatId,
          message_id: sentMessageId,
        });

        try {
          const forwardAndPin = async (fromChat: number, toChat: number) => {
            const forwardedMsg = await ctx.bot.forwardMessage(
              toChat,
              fromChat,
              sentPostMessage.message_id
            );
            await ctx.bot.pinChatMessage(toChat, forwardedMsg.message_id);
          };

          await forwardAndPin(TELEGRAM_RM6785_CHANNEL, TELEGRAM_RM6785_CHAT);
          await forwardAndPin(TELEGRAM_RM6785_CHANNEL, TELEGRAM_R7_CHAT);
        } catch (error) {
          console.error(error);
        }
      } else {
        msg.timeoutId = setTimeout(
          countdownTimeout,
          1000,
          ctx.message.reply_to_message!
        );
      }

      secondsLeft -= 1;
    };

    const timeoutId = setTimeout(
      countdownTimeout,
      1000,
      ctx.message.reply_to_message!
    );
    msg.timeoutId = timeoutId;
  } catch (error) {
    console.error(error);
  }
};

const handler: HandlerDescriptor = {
  command: "postrich",
  help: "Publish an approved message on the channel.",
  auth: true,
  reply_to_message: true,
  execute: postrichHandler,
};

export { handler };
