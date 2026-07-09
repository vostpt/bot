const { channels } = require('../../config/bot');
const { removeAccent } = require('../helpers');
const { EmbedBuilder } = require('discord.js');

const LOUSY_WORDS = [
  'merda',
  'caralho',
  'crl',
  'puta',
  'fodase',
  'foda-se',
];

module.exports = {
  name: 'lousy language',
  description: 'Avoid lousy language',
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID,
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
      message.reply({
        content: 'Hey',
        embeds: [
          new EmbedBuilder().setImage(
            'https://media.discordapp.net/attachments/1191900860045852813/1524751245586468864/tenor.gif'
          ),
        ],
      })
    }
  },
};
