import { Context, TelegramError } from "telegraf";
import { Update } from "telegraf/types";
const { TELEGRAM_RM6785_CHANNEL } = require("../constants.js");

const deleteHandler = async (ctx: Context<Update>): Promise<void> => {
  if (ctx.message === undefined) return;
  if (!("text" in ctx.message)) return;

  let msgText: String = ctx.message.text.replace(/^\/delete(@RM6785Bot)?/, "").trim();
  let splitMsg: Array<String> = msgText.split("/");
  if (splitMsg.length === 0) {
    ctx.reply("Are you sure that's a valid link?");
    return;
  }

  let msgToDeleteId: number = Number(splitMsg[splitMsg.length-1]);
  // Number("") evaluates to 0 so check that as well
  if (Number.isNaN(msgToDeleteId) || msgToDeleteId === 0) {
    ctx.reply("Invalid message id, the link you provided is not a message link");
    return;
  }

  try {
    await ctx.telegram.deleteMessage(TELEGRAM_RM6785_CHANNEL, msgToDeleteId);
    (ctx as any).replyToMessage("Requested message deleted");
  } catch (e: any) {
    let err = e as TelegramError;
    ctx.reply(`${err.name}\n${err.message}\n${err.description}`);
  }
};

module.exports = {
  command: "delete",
  help: "Delete a message in the channel. Provide message id.",
  auth: true,
  reply_to_message: false,
  execute: deleteHandler,
};
