import type { Context } from "telegraf";
import type { Message } from "telegraf/types";

declare module "telegraf" {
  interface Context {
    replyToMessage(
      replyText: string,
      extra?: Record<string, unknown>
    ): Promise<Message>;
  }
}

export interface RegisteredCommand {
  command: string;
  description: string;
  priority: number;
}

export interface HandlerDescriptor {
  command: string;
  help: string;
  execute: (ctx: Context) => Promise<void>;
  su?: boolean;
  auth?: boolean;
  reply_to_message?: boolean;
  require_data?: boolean;
  priority?: number;
}