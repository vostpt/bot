const axios = require('axios');
const { baseURL } = require('../../config/api');

const getByDay = (day = 0) => {
  return axios.get(`${baseURL}/getIPMA.php?day=${day}`);
};

module.exports = {
  getByDay,
};
