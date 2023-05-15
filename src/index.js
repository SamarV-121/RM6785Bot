const dotenv = require("dotenv");
const { Telegraf } = require("telegraf");
const handleAuthCommand = require("./commands/authCommand");
const handleLsAuthCommand = require("./commands/lsauthCommand");
const handleRmAuthCommand = require("./commands/rmauthCommand");
const handlePostCommand = require("./commands/postCommand");
const handleCancelCommand = require("./commands/cancelCommand");
const handleVoteCommand = require("./commands/voteCommand");
const handleLintCommand = require("./commands/lintCommand");
const authMiddleware = require("./middlewares/authMiddleware");
const replyToMessageMiddleware = require("./middlewares/replyToMessageMiddleware");

dotenv.config();

const bot = new Telegraf(process.env.BOT_TOKEN);

bot.context.replyToMessage = function (replyText) {
  const replyToMessageId = this.message.reply_to_message
    ? this.message.reply_to_message.message_id
    : this.message.message_id;

  this.telegram.sendMessage(this.message.chat.id, replyText, {
    reply_to_message_id: replyToMessageId,
  });
};

bot.command("lint", replyToMessageMiddleware, handleLintCommand);
bot.command("lsauth", handleLsAuthCommand);
bot.command(
  "auth",
  authMiddleware,
  replyToMessageMiddleware,
  handleAuthCommand
);
bot.command(
  "rmauth",
  authMiddleware,
  replyToMessageMiddleware,
  handleRmAuthCommand
);
bot.command(
  "post",
  authMiddleware,
  replyToMessageMiddleware,
  handlePostCommand
);
bot.command("cancel", authMiddleware, handleCancelCommand);
bot.hears("+1", authMiddleware, replyToMessageMiddleware, handleVoteCommand);

bot.launch();
