import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import TelegramBot from "node-telegram-bot-api";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import * as Middleware from "./middlewares";
import { BOT_TOKEN } from "./config";
import setupAutoPostDetection from "./autoPostDetection";
import type { RegisteredCommand, HandlerDescriptor, BotContext } from "./types";
import { replyToMessage } from "./utils/contextUtils";

const __dirname = dirname(fileURLToPath(import.meta.url));
const argv = yargs(hideBin(process.argv)).argv;

export const bot = new TelegramBot(BOT_TOKEN, { polling: true });

const me = await bot.getMe();
const botInfo = { id: me.id };

function compose(
  middlewares: Middleware.Middleware[]
): (ctx: BotContext) => Promise<void> {
  return async (ctx) => {
    let index = -1;
    async function dispatch(i: number): Promise<void> {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      if (i >= middlewares.length) return;
      await middlewares[i](ctx, () => dispatch(i + 1));
    }
    await dispatch(0);
  };
}

const handlerFiles = readdirSync(`${__dirname}/handlers`).filter(
  (file) => file.endsWith(".ts") || file.endsWith(".js")
);

export const registeredCommands: RegisteredCommand[] = [];

for (const handlerFile of handlerFiles) {
  const handlerModule = await import(`./handlers/${handlerFile}`);
  const handler = handlerModule.handler as HandlerDescriptor;

  const middlewares: Middleware.Middleware[] = [];

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

  const commandHandler = compose([
    ...middlewares,
    async (ctx) => {
      await handler.execute(ctx);
    },
  ]);

  const commands = handler.command.split(" or ");
  commands.forEach((command) => {
    if (command.match(/[^\w\s]/g)) {
      bot.onText(new RegExp(`^\\${command}(?:\\s.*)?$`), async (msg) => {
        await commandHandler({ bot, botInfo, message: msg });
      });
    } else {
      bot.onText(
        new RegExp(`^/${command}(?:@\\w+)?(?:\\s.*)?$`),
        async (msg) => {
          await commandHandler({ bot, botInfo, message: msg });
        }
      );

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

bot
  .getMyCommands()
  .then((fetchedCommands) => {
    const existingCommands = new Map(
      fetchedCommands.map(({ command }) => [command, true])
    );

    const commandsToRegister = registeredCommands.filter(
      ({ command }) => !existingCommands.has(command)
    );

    if (commandsToRegister.length > 0) {
      bot
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

bot.onText(/^\/start(?:@\w+)?(?:\s.*)?$/, async (msg) => {
  const ctx: BotContext = { bot, botInfo, message: msg };
  await replyToMessage(
    ctx,
    "Hola, amigo. I'm RM6785Bot, specially created to handle posts on the RM6785 telegram channel.\nSpank /help to know more about me"
  );
});

setupAutoPostDetection(bot, botInfo);

if ((argv as any).ci) {
  console.log("Starting the bot with CI");
  const { default: commitListener } = await import("./ci");
  setInterval(commitListener, 5000);
}
