const api = require('axios');
const { baseURL } = require('../../config/api');

const getIF = () => {
  return api.get(`${baseURL}/getIF.php`);
};

const getImportantIF = () => {
  return api.get(`${baseURL}/getImportantIF.php`);
};

const getByDistrict = (district) => {
  return api.get(`${baseURL}/getIFDistrito.php?distrito=${district}`);
};

module.exports = {
  getIF,
  getImportantIF,
  getByDistrict,
};
