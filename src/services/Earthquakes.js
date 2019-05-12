/**
 * Earthquakes gets a list of earthquakes registered by IPMA,
 * using bot api, and send to Discord (separated by sensed/non-sensed)
 */
const moment = require('moment');
const { EarthquakesApi } = require('../api');
const { channels } = require('../../config/bot');

/**
 * Returns array of all registered earthquakes
 *
 * @returns {Array} earthquakes
 */
const getAll = async () => {
  const { data: earthquakes = [] } = await EarthquakesApi.getAll();

  return earthquakes;
};

/**
 * Get earthquakes and filters by a specific date
 *
 * @param {Date} date
 * @returns {Array} earthquakes
 */
const getByDate = async (date) => {
  try {
    const earthquakes = await getAll();

    return earthquakes.filter(({ time }) => moment(time).format('L') === date);
  } catch (e) {
    throw e;
  }
};

const getRealTime = async (current) => {
  try {
    const earthquakes = await getAll();

    return earthquakes.filter(({ time }) => ((current - new Date(time).getTime()) / 1000) <= 600);
  } catch (e) {
    throw e;
  }
};

/**
 * Get registered earthquakes from the previous day and send response to Discord
 *
 * @param {Client} client
 */
const getEarthquakes = async (client) => {
  const yesterday = moment().subtract(1, 'days').format('L');

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

    // Format time (hh:mm)
    const formattedTime = moment(time).format('LT');

    // Add earthquake to the correct list
    if (sensed) {
      // Add to list of sensed earthquake
      eventsSensed.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`);
    } else {
      // Add to list of non-sensed earthquakes list
      events.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
    }
  });


  try {
    // Send list of sensed earthquakes to Discord
    if (eventsSensed.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos sentido dia ${yesterday}:***\n${eventsSensed.join('\n')}`);
    }

    // Send list of non-sensed earthquakes to Discord
    if (events.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos de ${yesterday}:***\n${events.join('\n')}`);
    }
  } catch (e) {
    //
  }
};

const getLastEarthquakes = async (client) => {
  const currentTime = new Date().getTime();

  const events = [];
  const eventsSensed = [];
  const earthquakes = await getRealTime(currentTime);

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
    // Format time (hh:mm)
    const formattedTime = moment(time).format('LT');

    // Add earthquake to the correct list
    if (sensed) {
      // Add to list of sensed earthquake
      eventsSensed.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`);
    } else if (magnitud >= 3) {
      events.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
    }
  });


  try {
    // Send list of sensed earthquakes to Discord
    if (eventsSensed.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos sentido nos últimos 10 minutos:***\n${eventsSensed.join('\n')}`);
    }

    // Send list of non-sensed earthquakes to Discord
    if (events.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos nos últimos 10 minutos:***\n${events.join('\n')}`);
    }
  } catch (e) {
    //
  }
};

module.exports = {
  getAll,
  getEarthquakes,
  getByDate,
  getLastEarthquakes,
  getRealTime,
};
