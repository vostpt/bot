const { TelegramClient } = require('messaging-api-telegram');
const { telegramKeys } = require('../../config/telegram');

const tClient = new TelegramClient({
  accessToken: telegramKeys.key,
});

/**
* Send a message to Telegram
*
* @async
* @param {Object} message
*/
const sendMessageTelegram = async (message) => {
  if (typeof message.photoURL !== 'undefined') {
    await tClient.sendPhoto(message.chatId, message.photoURL, { ...message.options });

    return;
  }

  await tClient.sendMessage(message.chatId, message.text, { ...message.options });
};

/**
* Send a group of messages to Telegram
*
* @async
* @param {Array<Object>} messages
*/

const sendMessagesTelegram = async (messages) => {
  const lastMessage = messages.pop();

  await messages.reduce(async (previous, message) => {
    await previous;

    await new Promise(r => setTimeout(r, 1000));

    const sequenceMsg = {
      ...message,
      options: {
        ...message.options,
        disable_notification: false,
      },
    };

    return sendMessageTelegram(sequenceMsg);
  }, Promise.resolve());

  await sendMessageTelegram(lastMessage);
};

module.exports = {
  sendMessageTelegram,
  sendMessagesTelegram,
};
