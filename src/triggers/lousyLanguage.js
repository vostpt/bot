module.exports = {
  name: 'lousy language',
  description: 'Avoid lousy language',

   /**
  * Send to Discord a message when someone uses lousy language in the server
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent.includes('merda')) {
      message.reply('Hey https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953');
    }
  },
};
