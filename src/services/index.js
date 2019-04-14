const { getEarthquakes } = require('./Earthquakes');
const { getWarnings } = require('./Warnings');
const { getForestFires } = require('./Fires');

module.exports = {
  getEarthquakes,
  getWarnings,
  getForestFires,
};
