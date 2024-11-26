const { cooldown } = require('../config/bot');
const { MISCELLANEOUS } = require('../config/strings');

module.exports = {
  active: true,
  name: 'miscellaneous',
  description: 'Miscellaneous things',
  args: false,
  cooldown,
  usage: ['coffee', 'champagne', 'bolo', 'alheira', 'voluntários', '💪'],


  /**
   * Send to Discord a custom message depending on commands
   *
   * @async
   * @param {Message} message
   */
  async execute(message) {
    const command = message.content.toLowerCase().replace(/\s+/g, '').replace('!', '');

    const entry = Object.entries(MISCELLANEOUS).find(([key]) => key === command);

    if (entry) {
      message.reply(`${MISCELLANEOUS[entry[0]]}`);
    }

  }
}
