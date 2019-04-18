const { Warnings } = require('../services');

module.exports = {
  name: 'alerts',
  args: false,
  usage: `
    **!alerts**
  `,
  description: '!alerts',
  async execute(message) {
    const events = [];

    const warnings = await Warnings.getAll();

    if (warnings.length === 0) {
      message.channel.send('***Sem Alertas***');

      return;
    }

    warnings.forEach((item) => {
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

    try {
      if (events.length > 0) {
        message.channel.send(`***Alertas:***\n${events.join('\n')}`);
      } else {
        message.channel.send('***Sem Alertas:***');
      }
    } catch (e) {
      //
    }
  },
};
