export default {
  async fetch(request: Request, env: any): Promise<Response> {
    const corsHeaders: Record<string, string> = {
      "Access-Control-Allow-Origin": "https://railway.app",
      "Access-Control-Allow-Methods": "POST",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === "POST") {
      const payload: any = await request.json();
      let text: string | undefined;

      // Github
      //   if (payload?.ref === "refs/heads/master") {
      //     const { commits } = payload;
      //     const { id, url, message } = commits[0];
      //     text = `<a href="${url}">${id.substring(0, 7)}</a>: ${message}`;
      //   }

      // Railway
      if (payload?.deployment) {
        const {
          status,
          deployment: { meta },
          project,
          service,
        } = payload;
        const { commitHash, commitMessage, repo } = meta;

        const commitHashShort = `${commitHash.substring(0, 7)}`;
        const commitUrl = `https://github.com/${repo}/commit/${commitHash}`;
        const deploymentUrl = `https://railway.app/project/${project.id}/service/${service.id}?id=${payload.deployment.id}`;

        text = `Railway: <a href="${deploymentUrl}">${status}</a>\n\n<a href="${commitUrl}">${commitHashShort}</a>: ${commitMessage}`;
      }

      if (!text) {
        return new Response(null, { headers: corsHeaders });
      }

      await sendTelegramMessage(text, env.TELEGRAM_TOKEN);
    }

    return new Response("\xAF\\_(\u30C4)_/\xAF", { headers: corsHeaders });
  },
};

async function sendTelegramMessage(
  text: string,
  botToken: string
): Promise<void> {
  const chatId = "-1001801695556";
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const params = {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  };

  await fetch(url, params);
}
