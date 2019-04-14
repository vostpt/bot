const api = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => {
  return api.get(`${baseURL}/getAllProciv.php`);
};

module.exports = {
  getAll,
};
