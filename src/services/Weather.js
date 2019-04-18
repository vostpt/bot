const { WeatherApi } = require('../api');

const getByDay = async (day) => {
  const { data: events = [] } = await WeatherApi.getByDay(day);

  return events;
};

module.exports = {
  getByDay,
};
