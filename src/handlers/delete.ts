import type { Context } from "telegraf";
import { TELEGRAM_RM6785_CHANNEL } from "../constants.js";
import type { HandlerDescriptor } from "../types.js";

const deleteHandler = async (ctx: Context): Promise<void> => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const msgUrl = ctx.message.text.split(" ")[1];
  const msgId = parseInt(msgUrl.split("/").pop() || "", 10);

  if (msgId <= 0) {
    await ctx.replyToMessage("Invalid message id");
    return;
  }

  try {
    await ctx.telegram.deleteMessage(TELEGRAM_RM6785_CHANNEL, msgId);
    await ctx.replyToMessage("Requested message deleted");
  } catch (e) {
    const error = e as Error;
    await ctx.replyToMessage(`Failed to delete message: ${error.message}`);
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