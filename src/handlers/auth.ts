import type { Context } from "telegraf";
import { addAuthorizedUser } from "../utils/authUtils.js";
import type { HandlerDescriptor } from "../types.js";

const authHandler = async (ctx: Context) => {
  if (
    !ctx.message ||
    !("reply_to_message" in ctx.message) ||
    !ctx.message.reply_to_message
  )
    return;

  const replyMsg = ctx.message.reply_to_message;
  if (!("from" in replyMsg) || !replyMsg.from) return;

  const user = replyMsg.from;
  const authorized = await addAuthorizedUser({
    id: user.id,
    username: user.username,
    first_name: user.first_name,
    last_name: user.last_name,
  });

  if (authorized) {
    await ctx.replyToMessage(
      `@${user.username || user.first_name} has been authorized to use the bot.`
    );
  } else {
    await ctx.replyToMessage("This user is already authorized.");
  }
};

const handler: HandlerDescriptor = {
  command: "auth",
  help: "Authorize a user to review and post messages to channel.",
  su: true,
  reply_to_message: true,
  execute: authHandler,
};

export default handler;