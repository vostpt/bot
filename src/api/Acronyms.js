const api = require('axios');

const baseURl = 'https://vost.mariosantos.net/api';

const get = acronym => api.get(`${baseURl}/acronym/${acronym.toLowercase()}.php`);

module.exports = {
  get,
};
