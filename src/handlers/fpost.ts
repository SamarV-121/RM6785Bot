import type { Context } from "telegraf";
import postHandler from "./post.js";
import { messageInfo } from "../utils/messageUtils.js";
import { MAX_VOTES } from "../constants.js";
import type { HandlerDescriptor } from "../types.js";

const fpostHandler = async (ctx: Context) => {
  if (
    !ctx.message ||
    !("reply_to_message" in ctx.message) ||
    !ctx.message.reply_to_message
  )
    return;

  const messageId = ctx.message.reply_to_message.message_id;
  const oldMessageInfo = messageInfo[messageId];

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  for (let i = 0; i < MAX_VOTES; i++) {
    messageInfo[messageId][-1 - i] = true;
  }
  await postHandler.execute(ctx);

  messageInfo[messageId] = oldMessageInfo;
};

const handler: HandlerDescriptor = {
  command: "fpost",
  help: "Publish an approved message on the channel.",
  su: true,
  reply_to_message: true,
  execute: fpostHandler,
};

export default handler;