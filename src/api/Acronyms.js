const api = require('./api');

const get = (acronym) => api.get(`https://api.vost.pt/v1/acronyms/?search=${acronym.toLowerCase()}&exact=1`);

module.exports = {
  get,
};
