/* eslint-disable node/no-unsupported-features/es-syntax */
const lintTelegramPost = require("../utils/lintUtils");
const { execute } = require("./vote");

const lintHandler = async (ctx) => {
  if (!ctx.message.reply_to_message.caption) {
    // Format the ERROR part to bold text
    // Utilize HTML parsing for formatting the replies
    return ctx.replyWithHTML(
      "<b>ERROR:</b> No ROM banner was found. Please provide a banner for the ROM.",
      {
        reply_to_message_id: ctx.message.reply_to_message.message_id,
      }
    );
  }

  const [lintResult, lintSuccessful] = lintTelegramPost(
    ctx.message.reply_to_message.caption,
    ctx.message.reply_to_message.caption_entities
  );

  // Utilize HTML parsing for formatting the replies
  ctx.replyWithHTML(lintResult, {
    reply_to_message_id: ctx.message.reply_to_message.message_id,
  });

  if (lintSuccessful) {
    const voteCommandCtx = {
      ...ctx,
      message: {
        ...ctx.message,
        from: { ...ctx.message.from, id: ctx.botInfo.id },
      },
    };

    execute(voteCommandCtx);
  }

  return Promise.resolve();
};

module.exports = {
  command: "lint",
  help: "Check the formatting and style of a post.",
  reply_to_message: true,
  execute: lintHandler,
};
