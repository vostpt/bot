const axios = require('axios');
const { baseURL } = require('../../config/api');

const getAll = () => {
  return axios.get(`${baseURL}/getAllProciv.php`);
};

module.exports = {
  getAll,
};
