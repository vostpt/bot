const api = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getAllProciv.php`);

module.exports = {
  getAll,
};
