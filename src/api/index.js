const baseApi = require('./api');
const earthquakesApi = require('./earthquakes');
const firesApi = require('./fires');
const ipmaApi = require('./ipma');
const journalApi = require('./journal');
const meteoAlarmApi = require('./meteo-alarm');
const procivApi = require('./prociv');
const warningsApi = require('./warnings');
const weatherApi = require('./weather');
const windApi = require('./wind');

module.exports = {
  baseApi,
  earthquakesApi,
  firesApi,
  ipmaApi,
  journalApi,
  meteoAlarmApi,
  procivApi,
  warningsApi,
  weatherApi,
  windApi
};

