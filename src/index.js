const { readdirSync } = require("fs");
const { Telegraf } = require("telegraf");
const Middleware = require("./middlewares");
const config = require("./config");

const bot = new Telegraf(config.BOT_TOKEN);

// Custom replyToMessage function to bot context
bot.context.replyToMessage = async function (replyText) {
  const replyToMessageId =
    this.message.reply_to_message?.message_id || this.message.message_id;

  return this.telegram.sendMessage(this.message.chat.id, replyText, {
    reply_to_message_id: replyToMessageId,
  });
};

// Get the list of all command handler files in the handlers directory
const handlerFiles = readdirSync(`${__dirname}/handlers`).filter((file) =>
  file.endsWith(".js")
);

const registeredCommands = [];

// Iterate over each handler file
handlerFiles.forEach((handlerFile) => {
  // eslint-disable-next-line import/no-dynamic-require, global-require
  const handler = require(`./handlers/${handlerFile}`);

  const middlewares = [];

  // Check if superuser middleware is required
  if (handler.su) {
    middlewares.push(Middleware.suMiddleware);
  }

  // Check if auth middleware is required
  if (handler.auth) {
    middlewares.push(Middleware.authMiddleware);
  }

  // Check if reply_to_message middleware is required
  if (handler.reply_to_message) {
    middlewares.push(Middleware.replyToMessageMiddleware);
  }

  const commandHandler = Telegraf.compose([...middlewares, handler.execute]);

  // Split commands by "or" and register each command
  const commands = handler.command.split(" or ");
  commands.forEach((command) => {
    if (command.match(/[^\w\s]/g)) {
      // Register command as hears if it contains special characters
      bot.hears(command, commandHandler);
    } else {
      // Register command as a regular slash command
      bot.command(command, commandHandler);

      // Store registered commands to be used in /help
      registeredCommands.push({ command: handler.command, help: handler.help });
    }
  });
});

// Register the /help command to display all registered commands and their help messages
bot.command("help", (ctx) => {
  let helpMessage = "Available commands:\n\n";
  registeredCommands.forEach((commandHandler) => {
    helpMessage += `/${commandHandler.command} - ${commandHandler.help}\n`;
  });
  ctx.replyToMessage(helpMessage);
});

bot.start((ctx) =>
  ctx.replyToMessage(
    "Hola, amigo. I'm RM6785Bot, specially created to handle posts on the RM6785 telegram channel.\nSpank /help to know more about me"
  )
);
bot.launch();
