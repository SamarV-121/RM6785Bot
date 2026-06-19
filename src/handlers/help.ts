import type { BotContext, HandlerDescriptor } from "../types";
import { replyToMessage } from "../utils/contextUtils";

const helpHandler = async (ctx: BotContext) => {
  const { registeredCommands } = await import("../index");
  registeredCommands.sort((a, b) => b.priority - a.priority);
  let helpMessage = "Available commands:\n\n";

  registeredCommands.forEach((command) => {
    helpMessage += `${command.command} - ${command.description}\n`;
  });
  await replyToMessage(ctx, helpMessage);
};

const handler: HandlerDescriptor = {
  command: "help",
  help: "Get information about all available commands.",
  execute: helpHandler,
  priority: 100,
};

export default handler;