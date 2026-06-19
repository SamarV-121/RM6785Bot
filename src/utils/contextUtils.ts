import type { Message, SendMessageParams } from "node-telegram-bot-api";
import type { BotContext } from "../types";

export async function replyToMessage(
  ctx: BotContext,
  replyText: string,
  extra?: Omit<SendMessageParams, "chat_id" | "text">
): Promise<Message> {
  const replyToMessageId =
    ctx.message.reply_to_message?.message_id || ctx.message.message_id;

  return ctx.bot.sendMessage(ctx.message.chat.id, replyText, {
    ...extra,
    reply_parameters: { message_id: replyToMessageId },
  });
}
