const api = require('axios');

const get = (acronym) => {
  const baseURl = 'https://vost.mariosantos.net/api';

  return api.get(`${baseURl}/acronym/${acronym.toLowercase()}.php`);
};

module.exports = {
  get,
};
