const api = require('./api');

const get = () => api.get('https://janaodaparaabastecer.vost.pt/storage/data/stats_global.json');

module.exports = {
  get,
};
