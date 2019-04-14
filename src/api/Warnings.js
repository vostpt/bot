const axios = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => {
  return axios.get(`${baseURL}/getAlertas.php`);
};

module.exports = {
  getAll,
};
