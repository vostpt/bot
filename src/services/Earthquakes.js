/**
 * Earthquakes gets a list of earthquakes registered by IPMA,
 * using bot api, and send to Discord (separated by sensed/non-sensed)
 */
const moment = require('moment');
const { EarthquakesApi } = require('../api');

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
  const earthquakes = await getAll();
  return earthquakes.filter(({ time }) => moment(time).format('L') === date);
};

/**
 * Get registered earthquakes from the previous day and send response to Discord
 *
 * @param {Client} client
 */
const getEarthquakes = async (day = moment().subtract(1, 'days').format('L')) => {
  const events = [];
  const eventsSensed = [];
  const earthquakes = await getByDate(day);

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

  return {
    events,
    eventsSensed,
  };
};

module.exports = {
  getAll,
  getEarthquakes,
  getByDate,
};
