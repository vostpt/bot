const { WarningsApi } = require('../api');

module.exports = {
  name: 'alerts',
  description: 'Alerts',
  async execute(message) {
    const events = [];

    const { data = {} } = await WarningsApi.getAll();

    data.forEach((item) => {
      const { local, alertas: alerts = [] } = item;

      events.push(`
        ${local}
      `);

      alerts.forEach((alert) => {
        const {
          nivel: level,
          tipo: type,
          icon,
          inicio: begin,
          fim: end,
        } = alert;

        const weatherType = type === 'Precipitação' ? 'Chuva' : type;

        events.push(`
        **${level}** // ${icon}${weatherType} // ${begin} :arrow_right: ${end}
        `);
      });
    });

    if (events.length > 0) {
      message.channel.send(`
        ***Alertas:***
        ${events.join('')}
      `);
    }
  },
};
