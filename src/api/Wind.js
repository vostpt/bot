const api = require('axios');
const { baseURL } = require('../../config/api');

const getById = id => api.get(`${baseURL}/getWindy.php?id=${id}`);

module.exports = {
  getById,
};
