import type { Context } from "telegraf";
import { removeAuthorizedUser } from "../utils/authUtils.js";
import type { HandlerDescriptor } from "../types.js";

const rmauthHandler = async (ctx: Context) => {
  if (
    !ctx.message ||
    !("reply_to_message" in ctx.message) ||
    !ctx.message.reply_to_message
  )
    return;

  const replyMsg = ctx.message.reply_to_message;
  if (!("from" in replyMsg) || !replyMsg.from) return;

  const user = replyMsg.from;
  const removed = await removeAuthorizedUser(user.id);

  if (removed) {
    await ctx.replyToMessage(
      `@${user.username || user.first_name} has been removed from the authorized users.`
    );
  } else {
    await ctx.replyToMessage("This user is not in the authorized users list.");
  }
};

const handler: HandlerDescriptor = {
  command: "rmauth",
  help: "Unauthorize a user from using the /post command.",
  su: true,
  reply_to_message: true,
  execute: rmauthHandler,
};

export default handler;