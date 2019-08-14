const api = require('./api');

const fuelUrl = 'https://janaodaparaabastecer.vost.pt';

const fuelStatsUrl = `${fuelUrl}/graphs/stats`;

const esriFuelStatsUrl = 'https://www.arcgis.com/apps/opsdashboard/index.html#/a4890bfd60df4c07bd67c857b73b452f';

const get = () => api.get(`${fuelUrl}/storage/data/stats_global.json`);

module.exports = {
  fuelUrl,
  fuelStatsUrl,
  esriFuelStatsUrl,
  get,
};
