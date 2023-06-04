const { Octokit } = require("@octokit/rest");

const config = require("../config");

const octokit = new Octokit({ auth: config.GIST_TOKEN });

const AuthUtils = {};

/**
 * Fetches the authorized users from a Gist.
 * @returns {Promise<Array>} An array of authorized user objects.
 */
AuthUtils.getAuthorizedUsers = async () => {
  try {
    const { data } = await octokit.gists.get({ gist_id: config.GIST_ID });
    const { files } = data;

    if ("auth.json" in files) {
      const { content } = files["auth.json"];
      if (content.trim().length > 0) {
        return JSON.parse(content);
      }
    }

    return [{ id: 1138003186, name: "SamarV-121" }];
  } catch (error) {
    console.error("Error fetching Gist data:", error);
    return [];
  }
};

/**
 * Uploads the current list of authorized users to a Gist.
 * @param {Object} jsonData - The JSON data representing the authorized users.
 * @returns {Promise<string|boolean>} - A Promise that resolves with the ID of the uploaded Gist, or `false` if an error occurs.
 */
AuthUtils.uploadAuthorizedUsers = async (jsonData) => {
  try {
    const { data } = await octokit.gists.update({
      gist_id: config.GIST_ID,
      files: {
        "auth.json": {
          content: JSON.stringify(jsonData, null, 2),
        },
      },
    });
    return data.id;
  } catch (error) {
    console.error("Error uploading Gist data:", error);
    return false;
  }
};

/**
 * Adds a user to the list of authorized users.
 * @param {Object} user The user object to add to the list.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user was added successfully, false if they were already authorized.
 */
AuthUtils.addAuthorizedUser = async (user) => {
  const authorizedUsers = await AuthUtils.getAuthorizedUsers();

  if (authorizedUsers.some((u) => u.id === user.id)) {
    return false;
  }

  authorizedUsers.push({
    id: user.id,
    name: user.username || `${user.first_name} ${user.last_name || ""}`,
  });

  try {
    await AuthUtils.uploadAuthorizedUsers(authorizedUsers);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Removes a user from the list of authorized users.
 * @param {number} userId The ID of the user to remove from the list.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user was removed successfully, false if they were not found in the list.
 */
AuthUtils.removeAuthorizedUser = async (userId) => {
  const authorizedUsers = await AuthUtils.getAuthorizedUsers();

  const index = authorizedUsers.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  authorizedUsers.splice(index, 1);

  try {
    await AuthUtils.uploadAuthorizedUsers(authorizedUsers);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
};

/**
 * Checks if a user is authorized to use the bot.
 * @param {number} userId The ID of the user to check.
 * @returns {Promise<boolean>} A Promise that resolves to true if the user is authorized, false otherwise.
 */
AuthUtils.isAuthorized = async (userId) => {
  const authorizedUsers = await AuthUtils.getAuthorizedUsers();
  return authorizedUsers.some((u) => u.id === userId);
};

module.exports = AuthUtils;
