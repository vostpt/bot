const api = require('./api');

const getIpma = zone => api.get(`http://api.ipma.pt/open-data/observation/seismic/${zone}.json`).then(data => data.data);

module.exports = {
  getIpma,
};
