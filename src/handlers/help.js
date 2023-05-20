const helpHandler = async (ctx) => {
  const registeredMyCommands = await ctx.telegram.getMyCommands();
  let helpMessage = "Available commands:\n\n";

  registeredMyCommands.forEach((command) => {
    helpMessage += `/${command.command} - ${command.description}\n`;
  });
  ctx.replyToMessage(helpMessage);
};

module.exports = {
  command: "help",
  help: "Get information about all available commands.",
  execute: helpHandler,
};
