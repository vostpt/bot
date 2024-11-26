const { channels } = require('../config/bot');
const { removeAccent } = require('../helpers');

module.exports = {
  name: 'Word reminder',
  description: 'Remind something when someone sends an word define in this module',
  limitToChannels: [],
  words: [
    'aprosoc',
  ],

  /**
  * Send to Discord a custom message according to the trigger or the content of the message
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = removeAccent(message.content.toLowerCase());
    if (messageContent.includes('aprosoc')) {
      message.reply('Outra vez aprosoc? vou dizer à <@502617955100786709> para iniciar o teu processo de expulsão <:fuga:680920290297118753>');
    }
  },
};

