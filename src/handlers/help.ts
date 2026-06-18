import type { Context } from "telegraf";
import type { HandlerDescriptor } from "../types.js";

const helpHandler = async (ctx: Context) => {
  const { registeredCommands } = await import("../index.js");
  registeredCommands.sort((a, b) => b.priority - a.priority);
  let helpMessage = "Available commands:\n\n";

  registeredCommands.forEach((command) => {
    helpMessage += `${command.command} - ${command.description}\n`;
  });
  await ctx.replyToMessage(helpMessage);
};

const handler: HandlerDescriptor = {
  command: "help",
  help: "Get information about all available commands.",
  execute: helpHandler,
  priority: 100,
};

export default handler;