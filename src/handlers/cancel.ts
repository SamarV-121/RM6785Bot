import type { Context } from "telegraf";
import { TELEGRAM_RM6785_CHANNEL } from "../constants.js";
import { messageInfo } from "../utils/messageUtils.js";
import type { HandlerDescriptor } from "../types.js";

const cancelHandler = async (ctx: Context) => {
  if (
    !ctx.message ||
    !("reply_to_message" in ctx.message) ||
    !ctx.message.reply_to_message
  )
    return;

  const messageId = ctx.message.reply_to_message.message_id;
  const msg = messageInfo[messageId];

  if (msg?.stickerMessageId) {
    clearTimeout(msg.timeoutId as ReturnType<typeof setTimeout>);

    ctx.telegram
      .deleteMessage(TELEGRAM_RM6785_CHANNEL, msg.stickerMessageId)
      .then(() => {
        msg.isPosted = false;
        msg.stickerMessageId = null;
        msg.sentMessageId = null;
        msg.timeoutId = null;

        ctx.replyToMessage("Successfully cancelled the scheduled post.", {
          reply_to_message_id: messageId,
        } as Parameters<typeof ctx.replyToMessage>[1]);
      })
      .catch((error) => {
        console.error(error);
      });
  } else {
    await ctx.replyToMessage("No scheduled post found to cancel.", {
      reply_to_message_id: messageId,
    } as Parameters<typeof ctx.replyToMessage>[1]);
  }
};

const handler: HandlerDescriptor = {
  command: "cancel",
  help: "Cancel a scheduled post. Please reply to the post you want to cancel.",
  auth: true,
  reply_to_message: true,
  execute: cancelHandler,
};

export default handler;