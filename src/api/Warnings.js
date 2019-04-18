const api = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getAlertas.php`);

module.exports = {
  getAll,
};
