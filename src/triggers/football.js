const { channels } = require('../config/bot');
const {
  FOOTBALL_JOKES
} = require('../config/strings');

module.exports = {
  name: 'football',
  description: 'Football related replies',
  limitToChannels: [
    channels.MY_TEST_BOT_CHANNEL_GERAL,
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
   * Send to Discord a custom message according to football club
   *
   * @async
   * @param {Message} message
   */
  async execute(message) {
    const joke = findMagicWordInMessage(String(message));
    if (joke != null) {
      message.reply(joke);
    }
  },
};

function findMagicWordInMessage(message) {
  const keys = Object.keys(FOOTBALL_JOKES);
  const foundKey = keys.find(key => message.toLowerCase().includes(key.toLowerCase()));
  if (foundKey) {
    return FOOTBALL_JOKES[foundKey];
  }
  return null;
}
