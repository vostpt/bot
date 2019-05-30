const api = require('./api');
const { baseURL } = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getAlertas.php`);
const getNewWarnings = () => api.get(`${baseURL}/getAvisos.php`);

module.exports = {
  getAll,
  getNewWarnings,
};
