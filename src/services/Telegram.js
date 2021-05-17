const { TelegramClient } = require('messaging-api-telegram');
const { telegramKeys, telegramKeysRally } = require('../../config/telegram');

const tClient = new TelegramClient({
  accessToken: telegramKeys.key,
});

// Confirm this
const tClientRally = new TelegramClient({
  accessToken: telegramKeysRally.key,
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

    await new Promise((r) => setTimeout(r, 1000));

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

const sendDocumentTelegram = async (message) => {
  if (typeof message.document !== 'undefined') {
    await tClient.sendDocument(message.chatId, message.document, { ...message.options });

    return;
  }

  await tClient.sendDocument(message.chatId, message.text, { ...message.options });
};

const sendMessageRally = async (message) => {
  if (typeof message.photoURL !== 'undefined') {
    await tClientRally.sendPhoto(message.chatId, message.photoURL, { ...message.options });

    return;
  }

  await tClientRally.sendMessage(message.chatId, message.text, { ...message.options });
};

module.exports = {
  sendMessageTelegram,
  sendMessagesTelegram,
  sendDocumentTelegram,
  sendMessageRally,
};
