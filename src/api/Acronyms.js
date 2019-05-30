const axios = require('axios');

const api = axios.create({
  headers: {
    'Content-Type': 'application/vnd.api+json',
  },
});

const get = acronym => api.get(`https://api.vost.pt/v1/acronyms/?search=${acronym.toLowerCase()}&exact=1`);

module.exports = {
  get,
};
