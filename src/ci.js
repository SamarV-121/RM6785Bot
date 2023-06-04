const { execSync } = require("child_process");
const { Octokit } = require("@octokit/rest");
const bot = require("./index");
const config = require("./config");
const simpleGit = require("simple-git");

const git = simpleGit();
const octokit = new Octokit({ auth: config.GH_REPO_TOKEN });

let latestRemoteCommit;
let latestCommitMessage;
let latestCommitUrl;

const pullChanges = () =>
  git.fetch("origin", "master").then(() => git.checkout("origin/master"));

const restartBot = async () => {
  try {
    await pullChanges();

    await bot.telegram.sendMessage(
      "-1001801695556",
      `[${latestRemoteCommit.substring(
        0,
        7
      )}](${latestCommitUrl}): ${latestCommitMessage}\n\nRestarting the bot`,
      { parse_mode: "Markdown" }
    );

    execSync("npm start -- --ci", { stdio: "inherit" });
    process.exit(0);
  } catch (error) {
    console.error(`Failed to restart bot: ${error.message}`);
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

      git.revparse("HEAD", (err, localCommitHead) => {
        if (err) {
          console.error("Failed to get local commit head:", err);
          return;
        }

        if (latestRemoteCommit !== localCommitHead) {
          console.log(
            `${latestRemoteCommit.substring(
              0,
              7
            )}: ${latestCommitMessage}\nRestarting the bot`
          );
          restartBot();
        }
      });
    }
  } catch (error) {
    console.error("Failed to fetch remote commits:", error);
  }
};

module.exports = commitListener;
