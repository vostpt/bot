const api = require('./api');
const { baseURL, endpoints } = require('../../config/api');

const getIF = () => api.get(`${baseURL}/getIF.php`);

const getImportantIF = () => api.get(`${baseURL}/getImportantIF.php`);

const getByDistrict = district => api.get(`${baseURL}/getIFDistrito.php?distrito=${district}`);

const tweetFogosPt = () => api.getText(`${endpoints.FOGOSPT}`);

module.exports = {
  getIF,
  getImportantIF,
  getByDistrict,
  tweetFogosPt,
};
