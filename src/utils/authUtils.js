const { Octokit } = require("@octokit/rest");

const { GIST_ID } = process.env;
const { GIST_TOKEN } = process.env;

const octokit = new Octokit({ auth: GIST_TOKEN });

async function getAuthorizedUsers() {
  try {
    const { data } = await octokit.gists.get({ gist_id: GIST_ID });
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
    return false;
  }
}

async function uploadAuthorizedUsers(jsonData) {
  try {
    const { data } = await octokit.gists.update({
      gist_id: GIST_ID,
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
}

async function addAuthorizedUser(user) {
  const authorizedUsers = await getAuthorizedUsers();

  if (authorizedUsers.some((u) => u.id === user.id)) {
    return false;
  }

  authorizedUsers.push({
    id: user.id,
    name: user.username || `${user.first_name} ${user.last_name || ""}`,
  });

  try {
    await uploadAuthorizedUsers(authorizedUsers);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function removeAuthorizedUser(userId) {
  const authorizedUsers = await getAuthorizedUsers();

  const index = authorizedUsers.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  authorizedUsers.splice(index, 1);

  try {
    await uploadAuthorizedUsers(authorizedUsers);
    return true;
  } catch (error) {
    console.error(error);
    return false;
  }
}

async function isAuthorized(userId) {
  const authorizedUsers = await getAuthorizedUsers();
  return authorizedUsers.some((u) => u.id === userId);
}

module.exports = {
  getAuthorizedUsers,
  addAuthorizedUser,
  removeAuthorizedUser,
  isAuthorized,
};
