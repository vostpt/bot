const { WeatherApi } = require('../api');

/**
 * Get weather data for today or tomorrow
 *
 * @param {Number} day
 * @returns {Array} events
 */
const getByDay = async (day) => {
  const { data: events = [] } = await WeatherApi.getByDay(day);

  return events;
};

module.exports = {
  getByDay,
};
