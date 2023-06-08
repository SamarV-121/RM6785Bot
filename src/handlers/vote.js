const { MessageUtils, messageInfo } = require("../utils/messageUtils");
const { MAX_VOTES } = require("../constants");

const voteHandler = async (ctx) => {
  const userId = ctx.message.from.id;
  const messageId = ctx.message.reply_to_message.message_id;

  if (MessageUtils.hasUserVoted(messageId, userId)) {
    ctx.replyToMessage(`User ${userId} has already voted for this message.`);
    return;
  }

  if (MessageUtils.hasEnoughVotes(messageId)) {
    ctx.replyToMessage(
      `This post already has enough approvals (${MAX_VOTES}/${MAX_VOTES})`
    );
    return;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  messageInfo[messageId][userId] = true;

  const votes = MessageUtils.currentVotes(messageId);

  ctx.replyToMessage(`Approval count (${votes}/${MAX_VOTES})`);
};

module.exports = {
  command: "approve or +1",
  help: "Approve a message to be posted on the channel.",
  auth: true,
  reply_to_message: true,
  execute: voteHandler,
};
