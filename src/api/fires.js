const api = require('./api');
const { baseURL } = require('../../config/api');

// Constants
const LOG_PREFIX = '[FiresAPI]';
const ENDPOINT = `${baseURL}`;

/**
 * Custom logger
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Fetch all fires data
 * @returns {Promise<Object>} API response
 */
const getIF = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/getIF.php`);
    logger.info(`Retrieved Fires data: ${response?.data?.length || 0} records`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch fires data', error);
    throw error;
  }
};


/**
 * Fetch all important fires data
 * @returns {Promise<Object>} API response
 */
const getImportantIF = async () => {
  try {
    const response = await api.get(`${ENDPOINT}/getImportantIF.php`);
    logger.info(`Retrieved Important Fires data: ${response?.data?.length || 0} records`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch Important fires data', error);
    throw error;
  }
};

/**
 * Fetch fires data by District
 * @param {string} district - District name
 * @returns {Promise<Object>} API response
 */
const getByDisctrict = async (district) => {
  try {
    const response = await api.get(`${ENDPOINT}/getIFDisctrito.php?distrito=${district}`);
    logger.info(`Retrieved Fires data by District ${district}: ${response?.data?.length || 0} records`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch fires data by District ${district}', error);
    throw error;
  }
};

module.exports = {
  getIF,
  getImportantIF,
  getByDisctrict,
}
