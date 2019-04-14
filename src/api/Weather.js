const api = require('axios');
const { baseURL } = require('../../config/api');

const getByDay = (day = 0) => {
  return api.get(`${baseURL}/getIPMA.php?day=${day}`);
};

module.exports = {
  getByDay,
};
