import type { Context } from "telegraf";
import { getAuthorizedUsers } from "../utils/authUtils.js";
import type { HandlerDescriptor } from "../types.js";

const lsauthHandler = async (ctx: Context) => {
  const authorizedUsers = await getAuthorizedUsers();
  let message = "Authorized users:\n";
  authorizedUsers.forEach((user) => {
    message += `[${user.name}](tg://user?id=${user.id})\n`;
  });
  await ctx.telegram.sendMessage(ctx.chat!.id, message, {
    parse_mode: "Markdown",
  });
};

const handler: HandlerDescriptor = {
  command: "lsauth",
  help: "List all authorized users who can post messages on the channel.",
  execute: lsauthHandler,
};

export default handler;