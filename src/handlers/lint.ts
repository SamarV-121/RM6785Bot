import type { Context } from "telegraf";
import lintTelegramPost from "../utils/lintUtils.js";
import voteHandler from "./vote.js";
import type { HandlerDescriptor } from "../types.js";

const lintHandler = async (ctx: Context) => {
  if (
    !ctx.message ||
    !("reply_to_message" in ctx.message) ||
    !ctx.message.reply_to_message
  )
    return;

  const replyMsg = ctx.message.reply_to_message;

  if (!("caption" in replyMsg) || !replyMsg.caption) {
    await ctx.replyWithHTML(
      "<b>ERROR:</b> No ROM banner was found. Please provide a banner for the ROM.",
      {
        reply_to_message_id: replyMsg.message_id,
      } as any
    );
    return;
  }

  const [lintResult, lintSuccessful] = lintTelegramPost(
    replyMsg.caption,
    "caption_entities" in replyMsg ? replyMsg.caption_entities ?? [] : []
  );

  ctx.replyWithHTML(lintResult, {
    reply_to_message_id: replyMsg.message_id,
  } as any);

  if (lintSuccessful) {
    const voteCommandCtx = {
      ...ctx,
      message: {
        ...ctx.message,
        from: { ...ctx.message.from, id: ctx.botInfo.id },
      },
    } as Context;

    await voteHandler.execute(voteCommandCtx);
  }
};

const handler: HandlerDescriptor = {
  command: "lint",
  help: "Check the formatting and style of a post.",
  reply_to_message: true,
  execute: lintHandler,
};

export default handler;