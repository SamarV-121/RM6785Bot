const UserRequestUtils = require("./utils/userRequestUtils");
const { TELEGRAM_RELEASE_CHAT } = require("./utils/lintUtils");

const setupAutoPostDetection = async (bot) => {
  bot.on("message", async (ctx) => {
    const { message } = ctx;
    // Disable post auto detection in public groups
    if (message.chat.type === "supergroup" && message.chat.username) {
      return;
    }

    if (typeof message.caption === "undefined") return;

    // recovery is currently not supported by linter,
    // so let's not trigger the linter if # is recovery.
    if (
      message.caption.search("#ROM") !== -1 ||
      message.caption.search("#KERNEL") !== -1
    ) {
      message.reply_to_message = {
        caption: message.caption,
        caption_entities: message.caption_entities,
      };
      if (message.chat.type === "private") {
        // eslint-disable-next-line global-require
        const [lintResult, lintSuccessful] = require("./utils/lintUtils")(
          message.reply_to_message.caption,
          message.reply_to_message.caption_entities
        );
        ctx.replyWithHTML(lintResult, {
          reply_to_message_id: ctx.message.reply_to_message.message_id,
        });
        if (lintSuccessful) {
          // eslint-disable-next-line global-require
          const { MAX_REQUESTS, REQUEST_TIMEOUT } = require("./constants");
          const userRequests = UserRequestUtils.updateUserRequest(ctx.chat.id);
          if (userRequests > MAX_REQUESTS) {
            ctx.reply(
              `Spam detected, Try again after ${
                REQUEST_TIMEOUT / 60000
              } minutes`
            );
            return;
          }

          await ctx.telegram.forwardMessage(
            TELEGRAM_RELEASE_CHAT,
            message.chat.id,
            message.message_id
          );
          ctx.replyToMessage("Forwarded post in the group for approval");
          const updatedCtx = {
            ...ctx,
            chat: { ...ctx.chat, id: TELEGRAM_RELEASE_CHAT },
          };

          // eslint-disable-next-line global-require
          require("./handlers/lsauth").execute(updatedCtx);
        }
      } else {
        // eslint-disable-next-line global-require
        require("./handlers/lint").execute(ctx);
      }
    }
  });
};

module.exports = setupAutoPostDetection;
