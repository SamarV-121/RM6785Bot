import type TelegramBot from "node-telegram-bot-api";
import { updateUserRequest } from "./utils/userRequestUtils";
import {
  TELEGRAM_RELEASE_CHAT,
  MAX_REQUESTS,
  REQUEST_TIMEOUT,
} from "./constants";
import lintTelegramPost from "./utils/lintUtils";
import { handler as lsauthHandler } from "./handlers/lsauth";
import { handler as lintHandler } from "./handlers/lint";
import type { BotContext } from "./types";
import { replyToMessage } from "./utils/contextUtils";

const setupAutoPostDetection = (bot: TelegramBot, botInfo: { id: number }) => {
  bot.on("message", async (msg) => {
    if (
      msg.chat.type === "supergroup" &&
      "username" in msg.chat &&
      msg.chat.username
    ) {
      return;
    }

    if (!msg.caption) return;

    if (
      msg.caption.search("#ROM") !== -1 ||
      msg.caption.search("#KERNEL") !== -1
    ) {
      const replyMsg = {
        message_id: msg.message_id,
        date: msg.date,
        chat: msg.chat,
        caption: msg.caption,
        caption_entities: msg.caption_entities,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      msg.reply_to_message = replyMsg as any;

      const ctx: BotContext = { bot, botInfo, message: msg };

      if (msg.chat.type === "private") {
        const [lintResult, lintSuccessful] = lintTelegramPost(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          replyMsg.caption!,
          (replyMsg as any).caption_entities ?? []
        );
        await bot.sendRichMessage(
          msg.chat.id,
          { markdown: lintResult },
          {
            reply_parameters: { message_id: msg.message_id },
          }
        );
        if (lintSuccessful) {
          const userRequests = updateUserRequest(msg.chat.id);
          if (userRequests > MAX_REQUESTS) {
            await bot.sendMessage(
              msg.chat.id,
              `Spam detected, Try again after ${
                REQUEST_TIMEOUT / 60000
              } minutes`
            );
            return;
          }

          await bot.forwardMessage(
            TELEGRAM_RELEASE_CHAT,
            msg.chat.id,
            msg.message_id
          );
          await replyToMessage(ctx, "Forwarded post in the group for approval");
          const updatedCtx: BotContext = {
            ...ctx,
            message: {
              ...msg,
              chat: { ...msg.chat, id: TELEGRAM_RELEASE_CHAT },
            },
          };

          await lsauthHandler.execute(updatedCtx);
        }
      } else {
        const lintCtx: BotContext = {
          ...ctx,
          message: {
            ...msg,
            reply_to_message: msg.reply_to_message,
          },
        };
        await lintHandler.execute(lintCtx);
      }
    }
  });
};

export default setupAutoPostDetection;
