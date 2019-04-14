const axios = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => {
  return axios.get(`${baseURL}/getSismos.php`);
};

module.exports = {
  getAll,
};
