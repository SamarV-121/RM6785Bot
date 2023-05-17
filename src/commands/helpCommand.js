const { readdirSync } = require("fs");

const handleHelpCommand = (ctx) => {
  try {
    const commandFiles = readdirSync(__dirname).filter((file) =>
      file.endsWith("Command.js")
    );

    let helpMessages = "Available Commands:\n\n";

    commandFiles.forEach((file) => {
      const command = require(`./${file}`);
      if (command.helpMessage) {
        helpMessages += `${command.helpMessage}\n`;
      }
    });

    ctx.reply(helpMessages);
  } catch (error) {
    console.error("Error retrieving help message:", error);
  }
};

module.exports = handleHelpCommand;
