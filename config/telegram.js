const {
  TELEGRAM_API_KEY,
  TELEGRAM_CHAT_ID,
  TELEGRAM_RALLY_API_KEY,
  TELEGRAM_RALLY_CHAT_ID,
} = process.env;

const telegramKeys = {
  key: TELEGRAM_API_KEY,
  chat_id: TELEGRAM_CHAT_ID,
};

const telegramKeysRally = {
  key: TELEGRAM_RALLY_API_KEY,
  chat_id: TELEGRAM_RALLY_CHAT_ID,
};

module.exports = {
  telegramKeys,
  telegramKeysRally,
};
