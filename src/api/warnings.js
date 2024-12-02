const api = require('./api');
const { baseURL, warnAppURL, warnAppKey } = require('../../config/api');

// Constants
const LOG_PREFIX = '[Warnings-API]';
const ENDPOINTS = {
  alerts: `${baseURL}/getAlertas.php`,
  warnings: `${baseURL}/getAvisos.php`
};

const headers = {
  'X-VOSTWARNINGS': warnAppKey
};

const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Get all alerts from the system
 * @returns {Promise<Object>} Response containing all alerts
 * @throws {Error} If the API request fails
 */
const getAll = async () => {
  try {
    const response = await api.get(ENDPOINTS.alerts);
    logger.info(`Retrieved ${response?.data?.length || 0} alerts`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch alerts', error);
    throw error;
  }
};

/**
 * Get new warnings from the system
 * @returns {Promise<Object>} Response containing new warnings
 * @throws {Error} If the API request fails
 */
const getNewWarnings = async () => {
  try {
    const response = await api.get(ENDPOINTS.warnings);
    logger.info(`Retrieved ${response?.data?.length || 0} new warnings`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch new warnings', error);
    throw error;
  }
};

/**
 * Post a new warning to the system
 * @param {Object} warning - Warning data to post
 * @returns {Promise<Object>} API response
 * @throws {Error} If the API request fails
 */
const postNewWarning = async (warning) => {
  try {
    const response = await api.post(warnAppURL, warning, headers);
    logger.info('Successfully posted new warning');
    return response;
  } catch (error) {
    logger.error('Failed to post warning', error);
    throw error;
  }
};

module.exports = {
  getAll,
  getNewWarnings,
  postNewWarning
};
