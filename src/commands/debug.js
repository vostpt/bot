const ip = require('ip');
const fetch = require('node-fetch');
const { cooldown, channels } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');

module.exports = {
  active: true,
  args: false,
  limitToChannels: [channels.MGMT_CHANNEL_ID],
  cooldown,
  name: 'debug',
  usage: `
  `,

  /**
  * Send debug information
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const processString = Object.entries(process.versions).map((procVersion) => `\t${procVersion}`);

    const pubIpAddr = await fetch('https://api.ipify.org?format=json').then((data) => data.json());

    const ipString = `IP interface: ${ip.address()}\nIP(s) público(s): ${pubIpAddr.ip}`;

    const string = `aqui está o debug:\n\`\`\`Versões:\n ${processString.join('\n')}\n${ipString}\`\`\``;

    sendMessageAnswer(message, string);
  },
};
