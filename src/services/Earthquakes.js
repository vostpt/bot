const moment = require('moment');
const { EarthquakesApi } = require('../api');
const { EARTHQUAKES_CHANNEL_ID } = require('../../config/bot');

const getEarthquakes = (client) => {
  const yesterday = moment().subtract(1, 'days');

  const events = [];
  const eventsSensed = [];
  EarthquakesApi.getAll().then((response) => {
    response.data.forEach((element) => {
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

      if (moment(time).format('L') === yesterday.format('L')) {
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
      }
    });

    if (eventsSensed.length > 0) {
      this.client.channels.get(EARTHQUAKES_CHANNEL_ID).send(`
        ***Sismos sentido dia ${yesterday.format('L')}:***
        ${eventsSensed.join('')}
      `);
    }

    if (events.length > 0) {
      try {
        client.channels.get(EARTHQUAKES_CHANNEL_ID).send(`
          ***Sismos de ${yesterday.format('L')}:***
          ${events.join('')}
        `);
      } catch (e) {
        //
      }
    }
  });
};

module.exports = {
  getEarthquakes,
};
