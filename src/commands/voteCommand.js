const {
  messageInfo,
  hasUserVoted,
  hasEnoughVotes,
  currentVotes,
} = require("../utils/messageUtils");
const { MAX_VOTES } = require("../constants");

const handleVoteCommand = async (ctx) => {
  const { message } = ctx;
  const messageId = message.reply_to_message.message_id;
  const userId = message.from.id;

  if (hasUserVoted(messageId, userId)) {
    ctx.replyToMessage(`User ${userId} has already voted for this message.`);
    return;
  }

  if (hasEnoughVotes(messageId)) {
    ctx.replyToMessage(
      `This post already has enough approvals (${MAX_VOTES}/${MAX_VOTES})`
    );
    return;
  }

  if (!messageInfo[messageId]) {
    messageInfo[messageId] = {};
  }

  messageInfo[messageId][userId] = true;

  const votes = currentVotes(messageId);

  ctx.replyToMessage(`Approval count (${votes}/${MAX_VOTES})`);
};

module.exports = handleVoteCommand;
