const { TELEGRAM } = require('../config/services');
const { TelegramClient } = require('messaging-api-telegram');
const { telegramKeys, telegramKeysRally } = require('../../config/telegram');

// Constants
const LOG_PREFIX = '[Telegram]';
const MESSAGE_DELAY = 1000; // 1 second delay between messages

/**
 * Custom logger for Telegram service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Initialize Telegram clients
 */
const initializeClients = () => {
  try {
    if (!TELEGRAM || !TELEGRAM.enabled) {

      logger.warning('Telegram service is disabled in configuration');
      return null;
    }

    const tClient = new TelegramClient({
      accessToken: telegramKeys.key,
    });

    const tClientRally = new TelegramClient({
      accessToken: telegramKeysRally.key,
    });

    logger.info('Telegram clients initialized successfully');
    return { tClient, tClientRally };
  } catch (error) {
    logger.error('Failed to initialize Telegram clients', error);
    throw error;
  }
};

const { tClient, tClientRally } = initializeClients();

/**
 * Send a message to Telegram
 * @param {Object} message - Message data with optional photo
 */
const sendMessageTelegram = async (message) => {
  try {
    if (message.photoURL) {
      await tClient.sendPhoto(message.chatId, message.photoURL, { ...message.options });
      logger.info(`Sent photo message to chat ${message.chatId}`);
    } else {
      await tClient.sendMessage(message.chatId, message.text, { ...message.options });
      logger.info(`Sent text message to chat ${message.chatId}`);
    }
  } catch (error) {
    logger.error(`Failed to send message to chat ${message.chatId}`, error);
    throw error;
  }
};

/**
 * Send a group of messages to Telegram
 * @param {Array<Object>} messages - Array of message data
 */
const sendMessagesTelegram = async (messages) => {
  if (!messages || messages.length === 0) {
    logger.warning('No messages to send');
    return;
  }

  try {
    logger.info(`Starting to send ${messages.length} messages`);
    const messagesToSend = [...messages];
    const lastMessage = messagesToSend.pop();

    await messagesToSend.reduce(async (previous, message) => {
      await previous;
      await new Promise((resolve) => setTimeout(resolve, MESSAGE_DELAY));

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
    logger.info('Finished sending message sequence');
  } catch (error) {
    logger.error('Failed to send message sequence', error);
    throw error;
  }
};

/**
 * Send a document to Telegram
 * @param {Object} message - Message data with document
 */
const sendDocumentTelegram = async (message) => {
  try {
    if (message.document) {
      await tClient.sendDocument(message.chatId, message.document, { ...message.options });
    } else {
      await tClient.sendDocument(message.chatId, message.text, { ...message.options });
    }
    logger.info(`Sent document to chat ${message.chatId}`);
  } catch (error) {
    logger.error(`Failed to send document to chat ${message.chatId}`, error);
    throw error;
  }
};

/**
 * Send a message using the Rally client
 * @param {Object} message - Message data with optional photo
 */
const sendMessageRally = async (message) => {
  try {
    if (message.photoURL) {
      await tClientRally.sendPhoto(message.chatId, message.photoURL, { ...message.options });
      logger.info(`Sent rally photo message to chat ${message.chatId}`);
    } else {
      await tClientRally.sendMessage(message.chatId, message.text, { ...message.options });
      logger.info(`Sent rally text message to chat ${message.chatId}`);
    }
  } catch (error) {
    logger.error(`Failed to send rally message to chat ${message.chatId}`, error);
    throw error;
  }
};

module.exports = {
  sendMessageTelegram,
  sendMessagesTelegram,
  sendDocumentTelegram,
  sendMessageRally,
};
