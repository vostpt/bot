const api = require('./api');

const fuelUrl = 'https://janaodaparaabastecer.vost.pt';

const fuelStatsUrl = `${fuelUrl}/graphs/stats`;

const get = () => api.get(`${fuelUrl}/storage/data/stats_global.json`);

module.exports = {
  fuelUrl,
  fuelStatsUrl,
  get,
};
