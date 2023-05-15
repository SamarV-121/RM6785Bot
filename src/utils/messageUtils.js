const messageInfo = {};
const timeoutIds = [];
const { MAX_VOTES } = require("../constants");

const hasUserVoted = (messageId, userId) =>
  messageInfo[messageId] && messageInfo[messageId][userId];

const currentVotes = (messageId) =>
  messageInfo[messageId] ? Object.keys(messageInfo[messageId]).length : 0;

const hasEnoughVotes = (messageId) => {
  const votes = currentVotes(messageId);
  return votes >= MAX_VOTES;
};

module.exports = {
  messageInfo,
  timeoutIds,
  hasUserVoted,
  hasEnoughVotes,
  currentVotes,
};
