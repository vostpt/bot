module.exports = {
  name: 'lousy language',
  description: 'Avoid lousy language',
  async execute(message) {
    const messageContent = message.content.toLowerCase();

    if (messageContent.includes('merda')) {
      message.reply('Hey https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953');
    }
  },
};
