import type { BotContext, HandlerDescriptor } from "../types";
import { removeAuthorizedUser } from "../utils/authUtils";
import { replyToMessage } from "../utils/contextUtils";

const rmauthHandler = async (ctx: BotContext) => {
  if (!ctx.message.reply_to_message) return;

  const replyMsg = ctx.message.reply_to_message;
  if (!replyMsg.from) return;

  const user = replyMsg.from;
  const removed = await removeAuthorizedUser(user.id);

  if (removed) {
    await replyToMessage(
      ctx,
      `@${user.username || user.first_name} has been removed from the authorized users.`
    );
  } else {
    await replyToMessage(ctx, "This user is not in the authorized users list.");
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
