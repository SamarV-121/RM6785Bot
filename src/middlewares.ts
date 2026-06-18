import type { Context, MiddlewareFn } from "telegraf";
import { isAuthorized } from "./utils/authUtils.js";
import { TELEGRAM_SU_ID } from "./constants.js";

export const suMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  const userId = ctx.from?.id;

  if (!userId || !TELEGRAM_SU_ID.includes(userId)) {
    await ctx.replyToMessage("You are not authorized to use this command.");
    return;
  }

  return next();
};

export const authMiddleware: MiddlewareFn<Context> = async (ctx, next) => {
  if (!ctx.from) return;

  const userAuthorized = await isAuthorized(ctx.from.id);

  if (!userAuthorized) {
    await ctx.replyToMessage("You are not authorized to use this command.");
    return;
  }

  return next();
};

export const replyToMessageMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next
) => {
  const { message } = ctx;

  if (!message || !("reply_to_message" in message) || !message.reply_to_message) {
    await ctx.replyToMessage("Please reply to a message.");
    return;
  }

  return next();
};

export const checkDataMiddleware: MiddlewareFn<Context> = async (
  ctx,
  next
) => {
  if (!ctx.message || !("text" in ctx.message)) return;

  const msgText = ctx.message.text.split(" ");

  if (!msgText[1]) {
    await ctx.replyToMessage("No data is provided");
    return;
  }

  return next();
};