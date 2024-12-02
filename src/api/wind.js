const api = require('./api');
const { baseURL } = require('../../config/api');

const LOG_PREFIX = '[Wind-API]';

const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Get wind data for a specific location
 * @param {string} id - Location identifier
 * @returns {Promise<Object>} Wind data
 */
const getById = async (id) => {
  try {
    const response = await api.get(`${baseURL}/getWindy.php?id=${id}`);
    logger.info(`Retrieved wind data for location ${id}`);
    return response;
  } catch (error) {
    logger.error(`Failed to fetch wind data for location ${id}`, error);
    throw error;
  }
};

module.exports = {
  getById
};
