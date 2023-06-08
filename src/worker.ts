export default {
  async fetch(request, env) {
    const corsHeaders = {
      "Access-Control-Allow-Origin": "https://railway.app",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      let text;
      const payload = await request.json();

      // Github
      // if (payload?.repository?.full_name && payload?.ref === "refs/heads/master") {
      //   const latestCommit = payload.commits[0];
      //   const latestCommitHash = latestCommit.id;
      //   const latestCommitUrl = latestCommit.url;
      //   const latestCommitMessage = latestCommit.message;

      //   text = `<a href="${latestCommitUrl}">${latestCommitHash.substring(
      //     0,
      //     7
      //   )}</a>: ${latestCommitMessage}`;
      // }

      // Railway
      if (payload?.deployment) {
        const {
          status,
          deployment: { meta },
          project,
          service,
        } = payload;
        const { commitHash, commitMessage, repo } = meta;

        const commitUrl = `https://github.com/${meta.repo}/commit/${commitHash}`;
        const deploymentUrl = `https://railway.app/project/${project.id}/service/${service.id}?id=${payload.deployment.id}`;

        text = `${status}: <a href="${deploymentUrl}">Railway</a>\n\n<a href="${commitUrl}">${commitHash.substring(
          0,
          7
        )}</a>: ${commitMessage}`;
      }

      if (!text) {
        return new Response(null, { headers: corsHeaders });
      }

      const telegramBotToken = env.TELEGRAM_TOKEN;
      const chatId = "-1001801695556";
      const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage?chat_id=${chatId}&text=${text}&parse_mode=HTML&disable_web_page_preview=true`;
      await fetch(url, { headers: corsHeaders });
    }

    return new Response("¯\\_(ツ)_/¯", { headers: corsHeaders });
  },
};
