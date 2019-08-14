const fetch = require('node-fetch');

const defaultOptions = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
    Accept: 'application/vnd.api+json',
  },
};

const api = {
  get(url, customOptions = {}) {
    const options = { ...defaultOptions, ...customOptions };

    return fetch(url, options).then(data => data.json()).then(data => ({ data }));
  },
};

module.exports = api;
