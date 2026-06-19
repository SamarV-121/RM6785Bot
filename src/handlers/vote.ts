import type { BotContext, HandlerDescriptor } from "../types";
import {
  hasUserVoted,
  hasEnoughVotes,
  currentVotes,
  messageInfo,
} from "../utils/messageUtils";
import { MAX_VOTES } from "../constants";
import { replyToMessage } from "../utils/contextUtils";

const voteHandler = async (ctx: BotContext) => {
  if (!ctx.message.from) return;
  if (!ctx.message.reply_to_message) return;

  const userId = ctx.message.from.id;
  const messageId = ctx.message.reply_to_message.message_id;

  if (hasUserVoted(messageId, userId)) {
    await replyToMessage(
      ctx,
      `User ${userId} has already voted for this message.`
    );
    return;
  }

  if (hasEnoughVotes(messageId)) {
    await replyToMessage(
      ctx,
      `This post already has enough approvals ($$${MAX_VOTES}/${MAX_VOTES}$$)`
    );
    return;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  messageInfo[messageId][userId] = true;

  const votes = currentVotes(messageId);

  await replyToMessage(ctx, `Approval count ($$${votes}/${MAX_VOTES}$$)`);
};

const handler: HandlerDescriptor = {
  command: "approve or +1",
  help: "Approve a message to be posted on the channel.",
  auth: true,
  reply_to_message: true,
  execute: voteHandler,
};

export default handler;
