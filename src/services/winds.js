const { WINDS } = require('../config/services');
const { WindApi } = require('../api');

// Constants
const LOG_PREFIX = '[Winds]';

/**
 * Custom logger for Wind service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Get wind data for a specific city
 * @param {String} cityId - City identifier
 * @returns {Promise<Array>} Array of wind data
 */
const getById = async (cityId) => {
  try {
    if (!WINDS || !WINDS.enabled) {
      logger.warning('Wind service is disabled in configuration');
      return [];
    }

    logger.info(`Fetching wind data for city: ${cityId}`);
    
    const { winds = [] } = await WindApi.getById(cityId);
    
    logger.info(`Retrieved ${winds.length} wind records for city: ${cityId}`);
    return winds;
  } catch (error) {
    logger.error(`Failed to fetch wind data for city: ${cityId}`, error);
    throw error;
  }
};

module.exports = {
  getById,
};
