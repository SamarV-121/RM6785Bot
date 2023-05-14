require('dotenv').config()
const { Octokit } = require("@octokit/rest");
const TelegramBot = require('node-telegram-bot-api');

const gistId = process.env.GIST_ID;
const gistToken = process.env.GIST_TOKEN;
const telegramToken = process.env.RM6785BOT_TOKEN;
const telegramChats = [-1001299514785, -1001561214378];
const telegramRMX2001 = -1001384382397;
const telegramRM6785 = -1001754321934;
const telegramSticker = "CAACAgUAAxkBAAIX12Rci3DXLH_hj31gvbkmM6YSMEhUAAIvBAAC3gABcVWicSZoSZsiti8E";
const myId = 1138003186;

const bot = new TelegramBot(telegramToken, { polling: true });
const octokit = new Octokit({ auth: gistToken });

const messageVotes = {};
const timeoutIds = [];
let copyTimeout;
let sticketMessageId = null;
let botId;
let isValid;

bot.getMe().then((me) => {
    botId = me.id;
    console.log(`Bot has started, bot ID is ${botId}`);
}).catch((error) => console.error(error));

bot.onText(/^(\+1|\/post|\/(ls|rm)?auth|\/lint|\/cancel)$/, async (msg) => {
    isValid = false;

    try {
        const chatId = msg.chat.id;
        let messageId = msg.message_id;
        let userId = msg.from.id;
        const authorizedUsers = await fetchGist(gistId);

        if (!telegramChats.includes(chatId)) {
            return;
        }

        if (msg.text == "/lsauth") {
            let message = 'Authorized users:\n\n';
            authorizedUsers.forEach(user => {
                message += `[${user.name}](tg://user?id=${user.id})\n`;
            });
            bot.sendMessage(chatId, message, { reply_to_message_id: messageId, parse_mode: 'Markdown' });
            return;
        }

        if (msg.text == "/lint" && msg.reply_to_message && msg.reply_to_message.caption) {
            const [lintInfo, isValid] = lint(msg.reply_to_message.caption)
            bot.sendMessage(chatId, lintInfo, { reply_to_message_id: messageId });
        }

        if (msg.text !== "/lint" && !authorizedUsers.some(user => user.id === msg.from.id)) {
            bot.sendMessage(chatId, 'You are not authorized to use this command', { reply_to_message_id: messageId });
            return;
        }

        if (msg.text.match(/\/(rm)?auth/)) {
            if (!msg.reply_to_message) {
                bot.sendMessage(chatId, 'Reply to user\'s message', { reply_to_message_id: messageId });
                return;
            }

            const user = msg.reply_to_message.from;
            const name = user.username || `${user.first_name} ${user.last_name || ''}`;
            userId = user.id;

            if (myId !== msg.from.id) {
                bot.sendMessage(chatId, 'You are not authorized to use this command', { reply_to_message_id: messageId });
                return;
            }

            if (msg.text === "/auth") {
                const alreadyAuthorized = authorizedUsers.some(user => user.id === userId);

                if (alreadyAuthorized) {
                    bot.sendMessage(chatId, `${name} is already authorized.`, { reply_to_message_id: messageId });
                    return;
                }

                authorizedUsers.push({ id: userId, name });
                await uploadGist(gistId, authorizedUsers);
                bot.sendMessage(chatId, `${name} has been authorized to use the bot.`, { reply_to_message_id: messageId });
            } else if (msg.text === "/rmauth") {
                const index = authorizedUsers.findIndex(user => user.id === userId);

                if (index === -1) {
                    bot.sendMessage(chatId, `${name} is not in the authorized users list.`, { reply_to_message_id: messageId });
                    return;
                }

                authorizedUsers.splice(index, 1);
                await uploadGist(gistId, authorizedUsers);
                bot.sendMessage(chatId, `${name} has been removed from the authorized users.`, { reply_to_message_id: messageId });
            }
        }

        if (msg.text.match(/\+1|\/post/) || isValid) {
            if (msg.reply_to_message) {
                messageId = msg.reply_to_message.message_id;
            }
            const timeout = 300000;
            const maxVotes = 3;

            if (msg.text === "+1" || isValid) {
                if (!messageVotes[messageId]) {
                    messageVotes[messageId] = {};
                }

                if (isValid) {
                    userId = botId;
                }

                const currentVotes = messageVotes[messageId] ? Object.keys(messageVotes[messageId]).length : 0;
                if (currentVotes >= maxVotes) {
                  bot.sendMessage(chatId, `This post already has enough approvals (${currentVotes}/${maxVotes})`, { reply_to_message_id: messageId });
                  return;
                }

                if (!messageVotes[messageId][userId]) {
                    messageVotes[messageId][userId] = '+1';
                } else {
                    bot.sendMessage(chatId, `User ${userId} have already voted for it`, { reply_to_message_id: messageId });
                    return;
                }
            }

            const votes = messageVotes[messageId] ? Object.keys(messageVotes[messageId]).length : 0;
            bot.sendMessage(chatId, `Approval count (${votes}/${maxVotes})`, { reply_to_message_id: messageId });

            if (msg.text == "/post") {
                if (votes >= maxVotes) {
                    bot.sendSticker(telegramRMX2001, telegramSticker).then((sentSticker) => {
                        sticketMessageId = sentSticker.message_id;

                        bot.sendMessage(chatId, `Scheduled to post in ${timeout / 60000}m`, { reply_to_message_id: messageId });
                        copyTimeout = setTimeout(() => {
                            bot.copyMessage(telegramRMX2001, chatId, messageId).then((copiedMessage) => {
                                bot.forwardMessage(telegramRM6785, chatId, copiedMessage.message_id);
                                delete messageVotes[messageId];
                            })
                        }, timeout);
                        timeoutIds.push(copyTimeout);
                    })
                }
            }
        }

        if (msg.text == "/cancel") {
            if (sticketMessageId) {
                clearTimeout(copyTimeout);
                const timeoutIndex = timeoutIds.indexOf(copyTimeout);
                if (timeoutIndex !== -1) {
                    timeoutIds.splice(timeoutIndex, 1);
                }
                bot.deleteMessage(telegramRMX2001, sticketMessageId);
            }
        }
    } catch (error) {
        console.error(error);
    }
});

async function fetchGist(gistId) {
    try {
        const { data } = await octokit.gists.get({ gist_id: gistId });
        const { files } = data;

        if ('auth.json' in files) {
            const { content } = files['auth.json'];
            if (content.trim().length > 0) {
                return JSON.parse(content);
            }
        }

        return [{ id: myId, name: 'SamarV-121' }];
    } catch (error) {
        console.error('Error fetching Gist data:', error);
    }
}

async function uploadGist(gistId, jsonData) {
    try {
        const { data } = await octokit.gists.update({
            gist_id: gistId,
            files: {
                "auth.json": {
                    content: JSON.stringify(jsonData, null, 2),
                }
            }
        });
        return data.id;
    } catch (error) {
        console.error("Error uploading Gist data:", error);
    }
}

function lint(text) {
    let errors = "";
    const hashtags = text.match(/#\w+/g)?.map(tag => tag.slice(1)) || [];
    if (hashtags.length == 0) return ["ERROR: No hashtags found", false];

    const hashtag1 = hashtags[0];
    const hashtag2 = hashtags[1];
    const hashtag3 = hashtags[2];
    const hashtag4 = hashtags[3];
    const hashtag5 = hashtags[4];
    const hashtag6 = hashtags[5];

    const titleNewlines = text.slice(text.lastIndexOf(hashtags[hashtags.length - 1]) + hashtags[hashtags.length - 1].length)
        .slice(0, text.slice(text.lastIndexOf(hashtags[hashtags.length - 1]) + hashtags[hashtags.length - 1].length)
            .search(/\S/)).match(/\n/g);

    const title = text.match(/.*\w+(?= +for).*/)[0];
    const stage = title.match(/\[([^\]]+)\]$/) ? title.match(/\[([^\]]+)\]$/)[1] : '';

    // Hashtags
    if (!["UNOFFICIAL", "OFFICIAL"].includes(hashtag2)) {
        errors += "ERROR: Incorrect status on second hashtag (OFFICIAL/UNOFFICIAL)\n";
    }
    if (!["ROM", "KERNEL", "RECOVERY"].includes(hashtag3)) {
        errors += "ERROR: Incorrect type on 3rd hashtag (ROM/KERNEL/RECOVERY)\n";
    }
    if (!["RM6785", "RMX2001", "RMX2151"].includes(hashtag4)) {
        errors += "ERROR: Incorrect device on 4rd hashtag (RM6785/RMX2001/RMX2151)\n";
    }
    if ((hashtag3 !== "KERNEL") && !["A10", "A11", "A12", "A13"].includes(hashtag5)) {
        errors += "ERROR: Incorrect version on 5th hashtag (A10/A11/A12/A13)\n";
    }

    if ((hashtag3 == "KERNEL") && !["RUI1", "RUI2", "RUI3"].includes(hashtag5)) {
        errors += "ERROR: Incorrect RealmeUI version on last hashtag (RUI1/RUI2/RUI3)\n";
    }

    if ((hashtag3 !== "KERNEL") && !["RUI1", "RUI2", "RUI3"].includes(hashtag6)) {
        errors += "ERROR: Incorrect RealmeUI version on last hashtag (RUI1/RUI2/RUI3)\n";
    }

    // Title
    if (titleNewlines?.length !== 2) {
        errors += "ERROR: There must be 2 newlines after last hashtag\n";
    }

    if (!stage) {
        errors += "ERROR: Mention ROM stage eg [ALPHA/BETA]\n";
    }

    // Build info
    if (!text.match(/• Author: .+/)) {
        errors += "ERROR: Author\n";
    }

    if ((hashtag3 !== "KERNEL") && !text.match(/• Android version: [0-9].+/)) {
        errors += "ERROR: Android version\n";
    }

    if (!text.match(/• Build date: (0?[1-9]|[12][0-9]|3[01])-(0?[1-9]|1[0-2])-\d{4}/)) {
        errors += "ERROR: Build date\n";
    }

    if (!/Changelog\n(.*\n)*Bugs/.test(text)) {
        errors += "ERROR: Invalid changelog section.\n";
    }
    if (text.match(/\nnote/i)) {
        if (!text.match(/\nNotes\n•/)) {
            errors += "ERROR: Invalid notes section.\n";
        }
    }
    if (!text.match(/Bugs\n(.*\n)*Downloads/)) {
        errors += "ERROR: Invalid bugs section.\n";
    }
    if (!text.match(/• Build Type: .+\n• File Size: .+\n•.+/)) {
        errors += "ERROR: Invalid downloads section.\n";
    }
    if (!text.match(/\nSources/)) {
        errors += "ERROR: Sources.\n";
    }
    if ((hashtag3 !== "KERNEL") && !text.match(/\nScreenshots/)) {
        errors += "ERROR: Screenshots.\n";
    }
    if (!text.match(/\nSupport group/)) {
        errors += "ERROR: Support group.\n";
    }
    isValid = errors === "";
    lintInfo = errors === "" ? "Seems good 🤌\nBot approves" : errors;

    return [lintInfo, isValid];
};
