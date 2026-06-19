import type { BotContext, HandlerDescriptor } from "../types";
import { TELEGRAM_RM6785_CHANNEL } from "../constants";
import { replyToMessage } from "../utils/contextUtils";

const deleteHandler = async (ctx: BotContext): Promise<void> => {
  if (!ctx.message.text) return;

  const msgUrl = ctx.message.text.split(" ")[1];
  if (!msgUrl) {
    await replyToMessage(ctx, "Please provide a message URL.");
    return;
  }
  const msgId = parseInt(msgUrl.split("/").pop() || "", 10);

  if (isNaN(msgId) || msgId <= 0) {
    await replyToMessage(ctx, "Invalid message id");
    return;
  }

  try {
    await ctx.bot.deleteMessage(TELEGRAM_RM6785_CHANNEL, msgId);
    await replyToMessage(ctx, "Requested message deleted");
  } catch (e) {
    const error = e as Error;
    await replyToMessage(ctx, `Failed to delete message: ${error.message}`);
  }
};

const handler: HandlerDescriptor = {
  command: "delete",
  help: "Delete a message in the channel. Provide message url.",
  auth: true,
  require_data: true,
  execute: deleteHandler,
};

export default handler;