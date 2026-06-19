import type { BotContext, HandlerDescriptor } from "../types";
import { getAuthorizedUsers } from "../utils/authUtils";

const lsauthHandler = async (ctx: BotContext) => {
  const authorizedUsers = await getAuthorizedUsers();
  let message = "Authorized users:\n";
  authorizedUsers.forEach((user) => {
    message += `[${user.name}](tg://user?id=${user.id})\n`;
  });
  await ctx.bot.sendMessage(ctx.message.chat.id, message, {
    parse_mode: "Markdown",
  });
};

const handler: HandlerDescriptor = {
  command: "lsauth",
  help: "List all authorized users who can post messages on the channel.",
  execute: lsauthHandler,
};

export default handler;