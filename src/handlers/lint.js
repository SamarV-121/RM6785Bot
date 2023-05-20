/* eslint-disable node/no-unsupported-features/es-syntax */
const lintTelegramPost = require("../utils/lintUtils");
const { execute } = require("./vote");

const lintHandler = async (ctx) => {
  const [lintResult, lintSuccessful] = lintTelegramPost(
    ctx.message.reply_to_message.caption
  );

  ctx.replyToMessage(lintResult);

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
};

module.exports = {
  command: "lint",
  help: "Lint a post",
  reply_to_message: true,
  execute: lintHandler,
};
