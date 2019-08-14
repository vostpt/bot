const api = require('./api');
const { baseURL } = require('../../config/api');
const { vostApiBaseUrl } = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getAlertas.php`);
const getNewWarnings = () => api.get(`${baseURL}/getAvisos.php`);
const getIpmaWarnings = () => api.get(`${vostApiBaseUrl}/ipma/warnings`);

module.exports = {
  getAll,
  getNewWarnings,
  getIpmaWarnings,
};
