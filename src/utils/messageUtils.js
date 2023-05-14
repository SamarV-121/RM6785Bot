const { MAX_VOTES } = require("../constants");

const messageInfo = {};
const MessageUtils = {};

/**
 * Checks if a user has voted on a message.
 * @param {number} messageId - The ID of the message.
 * @param {number} userId - The ID of the user.
 * @returns {boolean} - A boolean indicating whether the user has voted.
 */
MessageUtils.hasUserVoted = (messageId, userId) =>
  messageInfo[messageId] && messageInfo[messageId][userId];

/**
 * Retrieves the current number of votes for a message.
 * @param {number} messageId - The ID of the message.
 * @returns {number} - The number of votes for the message.
 */
MessageUtils.currentVotes = (messageId) =>
  messageInfo[messageId] ? Object.keys(messageInfo[messageId]).length : 0;

/**
 * Checks if a message has enough votes.
 * @param {number} messageId - The ID of the message.
 * @returns {boolean} - A boolean indicating whether the message has enough votes.
 */
MessageUtils.hasEnoughVotes = (messageId) => {
  const votes = MessageUtils.currentVotes(messageId);
  return votes >= MAX_VOTES;
};

module.exports = {
  messageInfo,
  MessageUtils,
};
