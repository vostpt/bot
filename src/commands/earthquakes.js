const moment = require('moment');
const { EarthquakesApi } = require('../api');

module.exports = {
  name: 'sismos',
  args: true,
  usage: `
    **!sismos**
  `,
  execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply('falta a data.');
      return;
    }

    const [requestedDate] = args;

    const events = [];
    const eventsSensed = [];

    EarthquakesApi.getAll().then((res) => {
      const filteredDates = res.data.filter(
        ({ time }) => moment(time).format('L') === requestedDate,
      );

      if (filteredDates.length === 0) {
        message.reply(`Sem dados acerca do dia ${requestedDate}`);
        return;
      }

      filteredDates.forEach((element) => {
        const {
          sensed,
          time,
          magType,
          magnitud,
          depth,
          local,
          degree,
          shakemapref,
          lat,
          lon,
          obsRegion,
        } = element;

        const formattedTime = moment(time).format('LT');

        if (sensed) {
          eventsSensed.push(`
            ${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}
          `);
        } else {
          events.push(`
            ${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}
          `);
        }
      });

      if (eventsSensed.length > 0) {
        message.channel.send(`
          ***Sismos sentidos dia ${requestedDate}:***
          ${eventsSensed.join('')}
        `);
      }

      if (events.length > 0) {
        message.channel.send(`
          ***Sismos de ${requestedDate}:***
          ${events.join('')}
        `);
      }
    });
  },
};
