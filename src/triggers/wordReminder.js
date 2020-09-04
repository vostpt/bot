module.exports = {
  name: 'Word reminder',
  description: 'Remind something when someone sends a predetermined word',
  limitToChannels: [],

  /**
  * Send to Discord a custom message according to the trigger or the content of the message
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent === 'aprosoc') {
      message.reply('Outra vez aprosoc? vou dizer à <@502617955100786709> para iniciar o teu processo de expulsão :fuga:');
    }
  },
};
