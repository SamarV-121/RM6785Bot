const { REQUEST_TIMEOUT } = require("../constants");

const trackUserRequests = new Map();
const UserRequestUtils = {};

/**
 * Checks if a message has enough votes.
 * @param {number} userId - The ID of the message.
 * @returns {number} - A number indicating the number of requests done by a specific user.
 */
UserRequestUtils.updateUserRequest = (userId) => {
  let val = trackUserRequests.get(userId);

  if (val) {
    trackUserRequests.set(userId, val + 1);
  } else {
    val = 0;
    trackUserRequests.set(userId, 1);
    setTimeout(() => {
      trackUserRequests.delete(userId);
    }, REQUEST_TIMEOUT);
  }

  return val + 1;
};

module.exports = UserRequestUtils;
