const lintTelegramPost = require("../utils/lintUtils");
const handleVoteCommand = require("./voteCommand");

const handleLintCommand = async (ctx) => {
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

    handleVoteCommand(voteCommandCtx);
  }
};

module.exports = handleLintCommand;
