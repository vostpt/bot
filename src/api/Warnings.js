const api = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => {
  return api.get(`${baseURL}/getAlertas.php`);
};

module.exports = {
  getAll,
};
