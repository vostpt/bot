const api = require('./api');
const { baseURL } = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getSismos.php`);

module.exports = {
  getAll,
};
