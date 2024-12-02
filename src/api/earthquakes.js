const api = require('./api');
const { baseURL } = require('../../config/api');

// Constants
const LOG_PREFIX = '[EarthquakesAPI]';
const ENDPOINT = `${baseURL}/getSismos.php`;

/**
 * Custom logger
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Fetch all earthquakes data
 * @returns {Promise<Object>} API response
 */
const getAll = async () => {
  try {
    const response = await api.get(ENDPOINT);
    logger.info(`Retrieved earthquake data: ${response?.data?.length || 0} records`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch earthquake data', error);
    throw error;
  }
};

module.exports = {
  getAll
};
