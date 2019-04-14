const axios = require('axios');
const { baseURL } = require('../../config/api');

const getIF = () => {
  return axios.get(`${baseURL}/getIF.php`);
};

const getImportantIF = () => {
  return axios.get(`${baseURL}/getImportantIF.php`);
};

const getByDistrict = (district) => {
  return axios.get(`${baseURL}/getIFDistrito.php?distrito=${district}`);
};

module.exports = {
  getIF,
  getImportantIF,
  getByDistrict,
};
