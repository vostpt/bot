module.exports = {
  name: 'jorge',
  args: true,
  description: '!rcm',
  usage: `
    **!jorge**
  `,
  execute(message, args) {
    message.channel.send('YEP');
  },
};
