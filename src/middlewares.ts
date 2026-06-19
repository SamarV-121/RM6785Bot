import type { BotContext } from "./types";
import { isAuthorized } from "./utils/authUtils";
import { TELEGRAM_SU_ID } from "./constants";
import { replyToMessage } from "./utils/contextUtils";

export type Middleware = (
  ctx: BotContext,
  next: () => Promise<void>
) => Promise<void>;

export const suMiddleware: Middleware = async (ctx, next) => {
  const userId = ctx.message.from?.id;

  if (!userId || !TELEGRAM_SU_ID.includes(userId)) {
    await replyToMessage(ctx, "You are not authorized to use this command.");
    return;
  }

  return next();
};

export const authMiddleware: Middleware = async (ctx, next) => {
  if (!ctx.message.from) return;

  const userAuthorized = await isAuthorized(ctx.message.from.id);

  if (!userAuthorized) {
    await replyToMessage(ctx, "You are not authorized to use this command.");
    return;
  }

  return next();
};

export const replyToMessageMiddleware: Middleware = async (ctx, next) => {
  if (!ctx.message.reply_to_message) {
    await replyToMessage(ctx, "Please reply to a message.");
    return;
  }

  return next();
};

export const checkDataMiddleware: Middleware = async (ctx, next) => {
  if (!ctx.message.text) return;

  const msgText = ctx.message.text.split(" ");

  if (!msgText[1]) {
    await replyToMessage(ctx, "No data is provided");
    return;
  }

  return next();
};