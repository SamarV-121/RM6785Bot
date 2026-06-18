import { execSync } from "node:child_process";
import { Octokit } from "@octokit/rest";
import { bot } from "./index.js";
import { GH_REPO_TOKEN } from "./config.js";
import simpleGit from "simple-git";

const git = simpleGit();
const octokit = new Octokit({ auth: GH_REPO_TOKEN });

let latestRemoteCommit: string;
let latestCommitMessage: string;
let latestCommitUrl: string;

const pullChanges = () =>
  git.fetch("origin", "master").then(() => git.checkout("origin/master"));

const restartBot = async () => {
  const chatId = "-1001801695556";

  try {
    await pullChanges();

    await bot.telegram.sendMessage(
      chatId,
      `<a href="${latestCommitUrl}">${latestRemoteCommit.substring(
        0,
        7
      )}</a>: ${latestCommitMessage}\n\nRestarting the bot`,
      { parse_mode: "HTML" }
    );

    execSync("bun run src/index.ts -- --ci", { stdio: "inherit" });
    process.exit(0);
  } catch (error) {
    const err = error as Error;
    console.error(`Failed to restart bot: ${err.message}`);
    await bot.telegram.sendMessage(
      chatId,
      `Failed to restart bot: ${err.message}`
    );
  }
};

const commitListener = async () => {
  try {
    const { data: remoteCommits } = await octokit.repos.listCommits({
      owner: "SamarV-121",
      repo: "RM6785Bot",
    });

    if (remoteCommits?.length > 0) {
      latestRemoteCommit = remoteCommits[0].sha;
      latestCommitMessage = remoteCommits[0].commit.message;
      latestCommitUrl = remoteCommits[0].html_url;

      const localCommitHead = await git.revparse(["HEAD"]);

      if (latestRemoteCommit !== localCommitHead) {
        console.log(
          `${latestRemoteCommit.substring(
            0,
            7
          )}: ${latestCommitMessage}\nRestarting the bot`
        );
        restartBot();
      }
    }
  } catch (error) {
    const err = error as Error;
    console.error("Failed to fetch remote commits:", err);
  }
};

export default commitListener;