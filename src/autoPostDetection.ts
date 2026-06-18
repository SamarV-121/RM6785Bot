import type { Telegraf, Context } from "telegraf";
import { updateUserRequest } from "./utils/userRequestUtils.js";
import { TELEGRAM_RELEASE_CHAT, MAX_REQUESTS, REQUEST_TIMEOUT } from "./constants.js";
import lintTelegramPost from "./utils/lintUtils.js";
import lsauthHandler from "./handlers/lsauth.js";
import lintHandler from "./handlers/lint.js";

const setupAutoPostDetection = (bot: Telegraf<Context>) => {
  bot.on("message", async (ctx) => {
    const { message } = ctx;
    if ("chat" in message && message.chat.type === "supergroup" && "username" in message.chat && message.chat.username) {
      return;
    }

    if (!("caption" in message) || typeof message.caption === "undefined") return;

    if (
      message.caption.search("#ROM") !== -1 ||
      message.caption.search("#KERNEL") !== -1
    ) {
      message.reply_to_message = {
        message_id: message.message_id,
        date: message.date,
        chat: message.chat,
        caption: message.caption,
        caption_entities: message.caption_entities,
      } as any;

      if (message.chat.type === "private") {
        const replyMsg = message.reply_to_message as any;
        const [lintResult, lintSuccessful] = lintTelegramPost(
          replyMsg.caption!,
          replyMsg.caption_entities ?? []
        );
        await ctx.replyWithHTML(lintResult, {
          reply_to_message_id: message.message_id,
        } as any);
        if (lintSuccessful) {
          const userRequests = updateUserRequest(ctx.chat!.id);
          if (userRequests > MAX_REQUESTS) {
            await ctx.reply(
              `Spam detected, Try again after ${
                REQUEST_TIMEOUT / 60000
              } minutes`
            );
            return;
          }

          await ctx.telegram.forwardMessage(
            TELEGRAM_RELEASE_CHAT,
            message.chat.id,
            message.message_id
          );
          await ctx.replyToMessage("Forwarded post in the group for approval");
          const updatedCtx = {
            ...ctx,
            chat: { ...ctx.chat, id: TELEGRAM_RELEASE_CHAT },
          } as Context;

          await lsauthHandler.execute(updatedCtx);
        }
      } else {
        const lintCtx = {
          ...ctx,
          message: {
            ...ctx.message,
            reply_to_message: message.reply_to_message,
          },
        } as Context;
        await lintHandler.execute(lintCtx);
      }
    }
  });
};

export default setupAutoPostDetection;