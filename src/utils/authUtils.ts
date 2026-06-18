import { Octokit } from "@octokit/rest";
import { GIST_ID, GIST_TOKEN } from "../config.js";

const octokit = new Octokit({ auth: GIST_TOKEN });

interface AuthorizedUser {
  id: number;
  name: string;
}

export const getAuthorizedUsers = async (): Promise<AuthorizedUser[]> => {
  try {
    const { data } = await octokit.gists.get({ gist_id: GIST_ID });
    const { files } = data;

    if (files && "auth.json" in files) {
      const gistFile = files["auth.json"];
      if (gistFile && gistFile.content && gistFile.content.trim().length > 0) {
        return JSON.parse(gistFile.content) as AuthorizedUser[];
      }
    }

    return [{ id: 1138003186, name: "SamarV-121" }];
  } catch (error) {
    console.error("Error fetching Gist data:", error);
    return [];
  }
};

export const uploadAuthorizedUsers = async (
  jsonData: AuthorizedUser[]
): Promise<string | false> => {
  try {
    const { data } = await octokit.gists.update({
      gist_id: GIST_ID,
      files: {
        "auth.json": {
          content: JSON.stringify(jsonData, null, 2),
        },
      },
    });
    return data.id as string;
  } catch (error) {
    console.error("Error uploading Gist data:", error);
    return false;
  }
};

export const addAuthorizedUser = async (user: {
  id: number;
  username?: string;
  first_name: string;
  last_name?: string;
}): Promise<boolean> => {
  const authorizedUsers = await getAuthorizedUsers();

  if (authorizedUsers.some((u) => u.id === user.id)) {
    return false;
  }

  authorizedUsers.push({
    id: user.id,
    name: user.username || `${user.first_name} ${user.last_name || ""}`,
  });

  const uploadResult = await uploadAuthorizedUsers(authorizedUsers);
  return uploadResult !== false;
};

export const removeAuthorizedUser = async (
  userId: number
): Promise<boolean> => {
  const authorizedUsers = await getAuthorizedUsers();

  const index = authorizedUsers.findIndex((u) => u.id === userId);

  if (index === -1) {
    return false;
  }

  authorizedUsers.splice(index, 1);

  const uploadResult = await uploadAuthorizedUsers(authorizedUsers);
  return uploadResult !== false;
};

export const isAuthorized = async (userId: number): Promise<boolean> => {
  const authorizedUsers = await getAuthorizedUsers();
  return authorizedUsers.some((u) => u.id === userId);
};