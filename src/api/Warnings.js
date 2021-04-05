const api = require('./api');
const {
  baseURL,
  warnAppURL,
  warnAppKey,
} = require('../../config/api');

const getAll = () => api.get(`${baseURL}/getAlertas.php`);
const getNewWarnings = () => api.get(`${baseURL}/getAvisos.php`);

const postNewWarnHeader = {
  'X-VOSTWARNINGS': warnAppKey,
};

const postNewWarning = (body) => api.post(warnAppURL, body, postNewWarnHeader);

module.exports = {
  getAll,
  getNewWarnings,
  postNewWarning,
};
