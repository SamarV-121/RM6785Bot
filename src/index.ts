import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import { Telegraf } from "telegraf";
import type { MiddlewareFn } from "telegraf";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as Middleware from "./middlewares.js";
import { BOT_TOKEN } from "./config.js";
import setupAutoPostDetection from "./autoPostDetection.js";
import type { RegisteredCommand, HandlerDescriptor } from "./types.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = yargs(hideBin(process.argv)).argv;

export const bot = new Telegraf(BOT_TOKEN);

bot.context.replyToMessage = async function (this: any, replyText: string) {
  const msg = this.message;
  if (!msg) return undefined as any;

  const replyToMessageId =
    ("reply_to_message" in msg ? msg.reply_to_message?.message_id : undefined) ||
    msg.message_id;

  return this.telegram.sendMessage(msg.chat.id, replyText, {
    reply_to_message_id: replyToMessageId,
  } as any);
};

const handlerFiles = readdirSync(`${__dirname}/handlers`).filter((file) =>
  file.endsWith(".ts") || file.endsWith(".js")
);

export const registeredCommands: RegisteredCommand[] = [];

for (const handlerFile of handlerFiles) {
  const handlerModule = await import(`./handlers/${handlerFile}`);
  const handler = handlerModule.default as HandlerDescriptor;

  const middlewares: MiddlewareFn<any>[] = [];

  if (handler.su) {
    middlewares.push(Middleware.suMiddleware);
  }

  if (handler.auth) {
    middlewares.push(Middleware.authMiddleware);
  }

  if (handler.reply_to_message) {
    middlewares.push(Middleware.replyToMessageMiddleware);
  }

  if (handler.require_data) {
    middlewares.push(Middleware.checkDataMiddleware);
  }

  const commandHandler = Telegraf.compose([...middlewares, handler.execute]);

  const commands = handler.command.split(" or ");
  commands.forEach((command) => {
    if (command.match(/[^\w\s]/g)) {
      bot.hears(command, commandHandler);
    } else {
      bot.command(command, commandHandler);

      const prio = handler.priority ?? 0;
      registeredCommands.push({
        command: `/${command}`,
        description: handler.help,
        priority: prio,
      });

      console.log(`INFO: Successfully registered '${command}' command`);
    }
  });
}

bot.telegram
  .getMyCommands()
  .then((fetchedCommands) => {
    const existingCommands = new Map(
      fetchedCommands.map(({ command }) => [command, true])
    );

    const commandsToRegister = registeredCommands.filter(
      ({ command }) => !existingCommands.has(command)
    );

    if (commandsToRegister.length > 0) {
      bot.telegram
        .setMyCommands([...fetchedCommands, ...commandsToRegister])
        .catch((error: Error) => {
          console.log(
            `ERROR: Failed to register the slash commands:\n${error.message}`
          );
        });
    }
  })
  .catch((error: Error) => {
    console.log(
      `ERROR: Failed to fetch the registered commands:\n${error.message}`
    );
  });

bot.start((ctx) =>
  ctx.replyToMessage(
    "Hola, amigo. I'm RM6785Bot, specially created to handle posts on the RM6785 telegram channel.\nSpank /help to know more about me"
  )
);

setupAutoPostDetection(bot);

bot.launch();

if ((argv as any).ci) {
  console.log("Starting the bot with CI");
  const { default: commitListener } = await import("./ci.js");
  setInterval(commitListener, 5000);
}