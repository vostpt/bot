const api = require('axios');
const { baseURL } = require('../../config/api');

const getByDay = (day = 0) => api.get(`${baseURL}/getIPMA.php?day=${day}`);

module.exports = {
  getByDay,
};
