const fetch = require('node-fetch');

const defaultOptions = {
  headers: {
    'Content-Type': 'application/vnd.api+json',
  },
};

const api = {
  get(url, customOptions = {}) {
    const options = { ...defaultOptions, ...customOptions };

    return fetch(url, options).then((data) => data.json()).then((data) => ({ data }));
  },
  getHtml(url) {
    return fetch(url).then((res) => res.text());
  },
  getFileStream(url) {
    return fetch(url).then((res) => res.body);
  },
  post(url, body, customHeader = {}) {
    const options = {
      method: 'post',
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json', ...customHeader },
    };

    return fetch(url, options).then((data) => data.json());
  },
};

module.exports = api;
