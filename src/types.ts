import type TelegramBot from "node-telegram-bot-api";
import type { Message } from "node-telegram-bot-api";

export interface BotContext {
  bot: TelegramBot;
  botInfo: { id: number };
  message: Message;
}

export interface RegisteredCommand {
  command: string;
  description: string;
  priority: number;
}

export interface HandlerDescriptor {
  command: string;
  help: string;
  execute: (ctx: BotContext) => Promise<void>;
  su?: boolean;
  auth?: boolean;
  reply_to_message?: boolean;
  require_data?: boolean;
  priority?: number;
}
