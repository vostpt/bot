const {
  TELEGRAM_API_KEY,
  TELEGRAM_CHAT_ID,
} = process.env;

const telegramKeys = {
  key: TELEGRAM_API_KEY,
  chat_id: TELEGRAM_CHAT_ID,
};

module.exports = {
  telegramKeys,
};
