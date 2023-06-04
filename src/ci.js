const { execSync } = require("child_process");
const { Octokit } = require("@octokit/rest");
const simpleGit = require("simple-git");
const config = require("./config");

const octokit = new Octokit({ auth: config.GH_REPO_TOKEN });
const git = simpleGit();

const pullChanges = () =>
  git.fetch("origin", "master").then(() => git.checkout("origin/master"));

const restartBot = () => {
  pullChanges()
    .then(() => {
      execSync("npm start -- --ci", { stdio: "inherit" });

      process.exit(0);
    })
    .catch((error) => {
      console.error(`Failed to restart bot: ${error.message}`);
    });
};

const commitListener = () => {
  octokit.repos
    .listCommits({
      owner: "SamarV-121",
      repo: "RM6785Bot",
    })
    .then(({ data: remoteCommits }) => {
      if (remoteCommits?.length > 0) {
        const latestRemoteCommit = remoteCommits[0].sha;

        git.revparse("HEAD", (err, localCommitHead) => {
          if (err) {
            console.error("Failed to get local commit head:", err);
            return;
          }

          if (latestRemoteCommit !== localCommitHead) {
            console.log("Found a new update");
            restartBot();
          }
        });
      }
    })
    .catch((error) => console.error("Failed to fetch remote commits:", error));
};

module.exports = commitListener;
