const moment = require('moment');
const { channels } = require('../config/bot');
const { removeAccent } = require('../helpers');
const { 
  VOSTIA_REPLIES
} = require('../config/strings');


const getRandomMessage = () => {
    return VOSTIA_REPLIES[Math.floor(Math.random() * VOSTIA_REPLIES.length)];
};

module.exports = {
  name: 'botMention',
  description: 'Reply when bot is mentioned',
  limitToChannels: [
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
  * Send to Discord a greeting message according to time and/or user,
  * (if user has a defined custom message in PERSONAL_MESSAGES)
  *
  * @async
  * @param {Message} message
  * @param {Client} client
  */
      async execute(message, client) {
        if (message.mentions.users.has(client.user.id)) {
            return message.channel.send(getRandomMessage());
        }
    }

};


