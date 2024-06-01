import { Context } from "telegraf";
import { Update } from "telegraf/types";
const { TELEGRAM_RM6785_CHANNEL } = require("../constants.js");

const deleteHandler = async (ctx: Context<Update>): Promise<void> => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const msgUrl: string = ctx.message.text.split(" ")[1];
  const msgId: number = parseInt(msgUrl.split("/").pop() || "", 10);

  if (msgId <= 0) {
    await (ctx as any).replyToMessage("Invalid message id");
    return;
  }

  try {
    await ctx.telegram.deleteMessage(TELEGRAM_RM6785_CHANNEL, msgId);
    (ctx as any).replyToMessage("Requested message deleted");
  } catch (e: any) {
    (ctx as any).replyToMessage(`Failed to delete message: ${e.message}`);
  }
};

module.exports = {
  command: "delete",
  help: "Delete a message in the channel. Provide message url.",
  auth: true,
  require_data: true,
  execute: deleteHandler,
};
