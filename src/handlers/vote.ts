import type { Context } from "telegraf";
import { hasUserVoted, hasEnoughVotes, currentVotes, messageInfo } from "../utils/messageUtils.js";
import { MAX_VOTES } from "../constants.js";
import type { HandlerDescriptor } from "../types.js";

const voteHandler = async (ctx: Context) => {
  if (!ctx.message || !("from" in ctx.message)) return;

  const userId = ctx.message.from.id;
  if (!("reply_to_message" in ctx.message) || !ctx.message.reply_to_message) return;
  const messageId = ctx.message.reply_to_message.message_id;

  if (hasUserVoted(messageId, userId)) {
    await ctx.replyToMessage(`User ${userId} has already voted for this message.`);
    return;
  }

  if (hasEnoughVotes(messageId)) {
    await ctx.replyToMessage(
      `This post already has enough approvals (${MAX_VOTES}/${MAX_VOTES})`
    );
    return;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  messageInfo[messageId][userId] = true;

  const votes = currentVotes(messageId);

  await ctx.replyToMessage(`Approval count (${votes}/${MAX_VOTES})`);
};

const handler: HandlerDescriptor = {
  command: "approve or +1",
  help: "Approve a message to be posted on the channel.",
  auth: true,
  reply_to_message: true,
  execute: voteHandler,
};

export default handler;