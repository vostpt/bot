const { Warnings } = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  active: true,
  args: false,
  cooldown,
  name: 'alerts',
  usage: `
    **!alerts**
  `,

  /**
  * Send to Discord alerts issued by IPMA
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const events = [];

    const { acores = [], madeira = [], continente = [] } = await Warnings.getAll();

    const allEvents = [
      ...acores,
      ...madeira,
      ...continente,
    ];

    allEvents.forEach((item) => {
      const {
        local,
        alertas: alerts = [],
      } = item;

      events.push(`${local}\n`);

      alerts.forEach((alert) => {
        const {
          nivel: level,
          tipo: type,
          icon,
          inicio: begin,
          fim: end,
        } = alert;

        const weatherType = type === 'Precipitação' ? 'Chuva' : type.replace(' ', '');

        events.push(`**${level}** // ${icon}${weatherType} // ${begin} :arrow_right: ${end}`);
      });
    });

    if (events.length > 0) {
      message.channel.send(`***Avisos:***\n${events.join('\n')}`);
    } else {
      message.channel.send('***Sem Avisos***');
    }
  },
};
