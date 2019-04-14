const FireService = require('./Fires');
const ProcivService = require('./Prociv');
const WarningsService = require('./Warnings');
const EarthquakesService = require('./Earthquakes');
const AcronymsService = require('./Acronyms');
const WindService = require('./Wind');
const WeatherService = require('./Weather');

module.exports = {
  FireApi: FireService,
  ProcivApi: ProcivService,
  WarningsApi: WarningsService,
  EarthquakesApi: EarthquakesService,
  AcronymsApi: AcronymsService,
  WindApi: WindService,
  WeatherApi: WeatherService,
};
