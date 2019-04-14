const axios = require('axios');

const get = (acronym) => {
  const baseURl = 'https://vost.mariosantos.net/api';

  return axios.get(`${baseURl}/acronym/${acronym.toLowercase()}.php`);
};

module.exports = {
  get,
};
