import type { BotContext, HandlerDescriptor } from "../types";
import { TELEGRAM_RM6785_CHANNEL } from "../constants";
import { messageInfo } from "../utils/messageUtils";
import { replyToMessage } from "../utils/contextUtils";

const cancelHandler = async (ctx: BotContext) => {
  if (!ctx.message.reply_to_message) return;

  const messageId = ctx.message.reply_to_message.message_id;
  const msg = messageInfo[messageId];

  if (msg?.stickerMessageId && msg?.countdownMessageId) {
    clearTimeout(msg.timeoutId as ReturnType<typeof setTimeout>);

    try {
      await ctx.bot.deleteMessages(TELEGRAM_RM6785_CHANNEL, [
        msg.stickerMessageId,
        msg.countdownMessageId,
      ]);
      msg.isPosted = false;
      msg.stickerMessageId = null;
      msg.sentMessageId = null;
      msg.timeoutId = null;

      await replyToMessage(ctx, "Successfully cancelled the scheduled post.");
    } catch (error) {
      console.error(error);
      await replyToMessage(ctx, "Failed to cancel the scheduled post.");
    }
  } else {
    await replyToMessage(ctx, "No scheduled post found to cancel.");
  }
};

const handler: HandlerDescriptor = {
  command: "cancel",
  help: "Cancel a scheduled post. Please reply to the post you want to cancel.",
  auth: true,
  reply_to_message: true,
  execute: cancelHandler,
};

export { handler };
