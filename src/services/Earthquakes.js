const moment = require('moment');
const { EarthquakesApi } = require('../api');
const { channels } = require('../../config/bot');

const getAll = async () => {
  const { data: earthquakes = [] } = await EarthquakesApi.getAll();

  return earthquakes;
};

const getByDate = async (date) => {
  try {
    const earthquakes = await getAll();

    return earthquakes.filter(({ time }) => moment(time).format('L') === date);
  } catch (e) {
    throw e;
  }
};

const getEarthquakes = async (client) => {
  const yesterday = moment().subtract(1, 'days');

  const events = [];
  const eventsSensed = [];
  const earthquakes = await getByDate(yesterday);

  earthquakes.forEach((earthquake) => {
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
    } = earthquake;

    const formattedTime = moment(time).format('LT');

    if (sensed) {
      eventsSensed.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`);
    } else {
      events.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
    }
  });

  try {
    if (eventsSensed.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos sentido dia ${yesterday.format('L')}:***\n${eventsSensed.join('\n')}`);
    }

    if (events.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos de ${yesterday.format('L')}:***\n${events.join('\n')}`);
    }
  } catch (e) {
    //
  }
};

module.exports = {
  getAll,
  getEarthquakes,
  getByDate,
};
