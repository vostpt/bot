const axios = require('axios');
const { baseURL } = require('../../config/api');

const getById = (id) => {
  return axios.get(`${baseURL}/getWindy.php?id=${id}`);
};

module.exports = {
  getById,
};
