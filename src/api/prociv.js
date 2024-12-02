const api = require('./api');
const { baseURL } = require('../../config/api');

// Constants
const LOG_PREFIX = '[ProcivAPI]';
const ENDPOINT = `${baseURL}/getAllProciv.php`;

/**
 * Custom logger
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error)
};

/**
 * Fetch all Prociv data
 * @returns {Promise<Object>} API response
 */
const getAll = async () => {
  try {
    const response = await api.get(ENDPOINT);
    logger.info(`Retrieved Prociv data: ${response?.data?.length || 0} records`);
    return response;
  } catch (error) {
    logger.error('Failed to fetch Prociv data', error);
    throw error;
  }
};

module.exports = {
  getAll
};

