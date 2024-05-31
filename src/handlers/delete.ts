import { Context } from "telegraf";
import { Update } from "telegraf/types";
const { TELEGRAM_RM6785_CHANNEL } = require("../constants.js");

const deleteHandler = async (ctx: Context<Update>): Promise<void> => {
  if (ctx.message === undefined) return;
  if (!("text" in ctx.message)) return;

  let msgText: String = ctx.message.text.replace(/^\/delete/, "").trim();
  let msgToDeleteId: number = Number(msgText);
  if (Number.isNaN(msgToDeleteId)) {
    ctx.reply("Invalid message id");
    return;
  }

  ctx.telegram.deleteMessage(TELEGRAM_RM6785_CHANNEL, msgToDeleteId);
  ctx.reply("Requested message deleted");
};

module.exports = {
  command: "delete",
  help: "Delete a message in the channel. Provide message id.",
  auth: true,
  reply_to_message: false,
  execute: deleteHandler,
};
