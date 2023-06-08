const { registeredCommands } = require("../index");

const helpHandler = async (ctx) => {
  // always ensure commands are sorted according to their priority,
  // higher value = higher precedence
  registeredCommands.sort((a, b) => b.priority - a.priority);
  let helpMessage = "Available commands:\n\n";

  registeredCommands.forEach((command) => {
    helpMessage += `${command.command} - ${command.description}\n`;
  });
  ctx.replyToMessage(helpMessage);
};

module.exports = {
  command: "help",
  help: "Get information about all available commands.",
  execute: helpHandler,
  priority: 100,
};
