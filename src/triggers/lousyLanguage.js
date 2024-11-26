const { channels } = require('../config/bot');
const { removeAccent } = require('../helpers');

const { 
  LOUSY_WORDS,
} = require('../config/strings');

module.exports = {
  name: 'lousy language',
  description: 'Avoid lousy language',
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID, // TODO: Add more channels if needed
  ],

  /**
  * Send to Discord a message when someone uses lousy language in the server
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = removeAccent(message.content.toLowerCase().replace(/\s+/g, ''));

    if (LOUSY_WORDS.some((greeting) => messageContent.includes(greeting))) {
      message.reply('Hey https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953');
    }
  },
};

