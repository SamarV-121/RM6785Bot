const { readdirSync } = require("fs");
const { Telegraf } = require("telegraf");
const yargs = require("yargs");
const Middleware = require("./middlewares");
const config = require("./config");
const linter = require("./handlers/lint");
const { TELEGRAM_RELEASE_CHAT } = require("./constants");
const UserRequestUtils = require("./utils/userRequestUtils");

const { argv } = yargs;
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

module.exports = { registeredCommands };

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

  // Check if require_data middleware is required
  if (handler.require_data) {
    middlewares.push(Middleware.checkDataMiddleware);
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
      const prio = handler.priority ?? 0;
      registeredCommands.push({
        command: `/${command}`,
        description: handler.help,
        priority: prio, // used for sorting help message
      });

      console.log(`INFO: Successfully registered '${command}' command`);
    }
  });
});

// Fetch all of the registered commands
bot.telegram
  .getMyCommands()
  .then((fetchedCommands) => {
    const existingCommands = new Map(
      fetchedCommands.map(({ command }) => [command, true])
    );

    // Filter out commands that are already registered
    const commandsToRegister = registeredCommands.filter(
      ({ command }) => !existingCommands.has(command)
    );

    // Register the missing commands
    if (commandsToRegister.length > 0) {
      bot.telegram
        .setMyCommands([...fetchedCommands, ...commandsToRegister])
        .catch((error) => {
          console.log(
            `ERROR: Failed to register the slash commands:\n${error.message}`
          );
        });
    }
  })
  .catch((error) => {
    console.log(
      `ERROR: Failed to fetch the registered commands:\n${error.message}`
    );
  });

bot.start((ctx) =>
  ctx.replyToMessage(
    "Hola, amigo. I'm RM6785Bot, specially created to handle posts on the RM6785 telegram channel.\nSpank /help to know more about me"
  )
);

bot.on("message", async (ctx) => {
  const { message } = ctx;

  // Disable post auto detection in public groups
  if (message.chat.type === "supergroup" && message.chat.username) {
    return;
  }

  if (typeof message.caption === "undefined") return;

  // recovery is currently not supported by linter,
  // so let's not trigger the linter if # is recovery.
  if (
    message.caption.search("#ROM") !== -1 ||
    message.caption.search("#KERNEL") !== -1
  ) {
    message.reply_to_message = {
      caption: message.caption,
      caption_entities: message.caption_entities,
    };
    if (message.chat.type === "private") {
      const [lintResult, lintSuccessful] = require("./utils/lintUtils")(
        message.reply_to_message.caption,
        message.reply_to_message.caption_entities
      );
      ctx.replyWithHTML(lintResult, {
        reply_to_message_id: ctx.message.reply_to_message.message_id,
      });

      if (lintSuccessful) {
        const { MAX_REQUESTS, REQUEST_TIMEOUT } = require("./constants");
        const userRequests = UserRequestUtils.updateUserRequest(ctx.chat.id);
        if (userRequests > MAX_REQUESTS) {
          ctx.reply(
            `Spam detected, Try again after ${REQUEST_TIMEOUT / 60000} minutes`
          );
          return;
        }

        await ctx.telegram.forwardMessage(
          TELEGRAM_RELEASE_CHAT,
          message.chat.id,
          message.message_id
        );
        ctx.replyToMessage("Forwarded post in the group for approval");
        const updatedCtx = {
          ...ctx,
          chat: { ...ctx.chat, id: TELEGRAM_RELEASE_CHAT },
        };

        require("./handlers/lsauth").execute(updatedCtx);
      }
    } else {
      linter.execute(ctx);
    }
  }
});

bot.launch();

module.exports = { bot };

if (argv.ci) {
  console.log("Starting the bot with CI");
  const commitListener = require("./ci");

  setInterval(commitListener, 5000);
}
