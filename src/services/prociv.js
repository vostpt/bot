const { PROCIV } = require('../config/services');
const { removeAccent } = require('../helpers');
const { ProcivApi } = require('../api');

// Constants
const LOG_PREFIX = '[ProCiv]';
const CURRENT_YEAR = new Date().getFullYear().toString();

/**
 * Status mappings
 */
const STATUS = {
  // Status abbreviation to ID mapping
  ABBREV_TO_ID: {
    despacho: 3,
    despacho1alerta: 4,
    curso: 5,
    chegadato: 6,
    resolucao: 7,
    conclusao: 8,
    vigilancia: 9,
  },
  // Status ID to description mapping
  ID_TO_DESC: {
    3: 'Despacho',
    4: 'Despacho de 1º alerta',
    5: 'Em Curso',
    6: 'Chegada ao TO',
    7: 'Em Resolução',
    8: 'Em Conclusão',
    9: 'Vigilância',
  }
};

/**
 * Custom logger for ProCiv service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Validate numeric input
 * @param {Number|String} value - Value to validate
 * @returns {Number} Validated number
 * @throws {Error} If validation fails
 */
const validateNumericInput = (value) => {
  const numValue = Number(value);
  if (Number.isNaN(numValue) || numValue < 0) {
    throw new Error('Invalid numeric input');
  }
  return numValue;
};

/**
 * Get all occurrences
 * @returns {Promise<Array>} List of all occurrences
 */
const getAll = async () => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const { data = [] } = await ProcivApi.getAll();
    logger.info(`Retrieved ${data.length} occurrences`);
    return data;
  } catch (error) {
    logger.error('Failed to fetch occurrences', error);
    throw error;
  }
};

/**
 * Get occurrence by ID
 * @param {String} requestedId - Occurrence ID
 * @returns {Promise<Array>} Matching occurrences
 */
const getById = async (requestedId) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }

    const events = await getAll();
    const reqIdFormatted = requestedId.startsWith(CURRENT_YEAR) && requestedId.length >= 13
      ? requestedId.slice(4)
      : requestedId;
    
    const filtered = events.filter(({ id }) => id === reqIdFormatted);
    logger.info(`Found ${filtered.length} occurrences for ID: ${requestedId}`);
    return filtered;
  } catch (error) {
    logger.error(`Failed to get occurrence by ID: ${requestedId}`, error);
    throw error;
  }
};

/**
 * Search occurrences by city or location
 * @param {String} searchId - Search term
 * @returns {Promise<Array>} Matching occurrences
 */
const getByCityAndLocal = async (searchId) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const events = await getAll();
    const searchTerm = searchId.toLowerCase();
    
    const filtered = events.filter(({ l: city, s: local }) => {
      const normalizedCity = removeAccent(city.toLowerCase());
      const normalizedLocal = removeAccent(local.toLowerCase());
      return normalizedCity.includes(searchTerm) || normalizedLocal.includes(searchTerm);
    });

    logger.info(`Found ${filtered.length} occurrences for location: ${searchId}`);
    return filtered;
  } catch (error) {
    logger.error(`Failed to search by location: ${searchId}`, error);
    throw error;
  }
};

/**
 * Filter occurrences by minimum number of operatives
 * @param {Number} minimum - Minimum number of operatives
 * @returns {Promise<Array>} Filtered occurrences
 */
const filterByMinimumOperatives = async (minimum) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const minOperatives = validateNumericInput(minimum);
    const events = await getAll();
    const filtered = events.filter(({ o: operatives }) => operatives > minOperatives);
    logger.info(`Found ${filtered.length} occurrences with >${minOperatives} operatives`);
    return filtered;
  } catch (error) {
    logger.error('Failed to filter by minimum operatives', error);
    throw error;
  }
};

/**
 * Filter occurrences by minimum number of vehicles
 * @param {Number} minimum - Minimum number of vehicles
 * @returns {Promise<Array>} Filtered occurrences
 */
const filterByMinimumVehicles = async (minimum) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const minVehicles = validateNumericInput(minimum);
    const events = await getAll();
    const filtered = events.filter(({ t: vehicles }) => vehicles > minVehicles);
    logger.info(`Found ${filtered.length} occurrences with >${minVehicles} vehicles`);
    return filtered;
  } catch (error) {
    logger.error('Failed to filter by minimum vehicles', error);
    throw error;
  }
};

/**
 * Filter occurrences by minimum number of aircraft
 * @param {Number} minimum - Minimum number of aircraft
 * @returns {Promise<Array>} Filtered occurrences
 */
const filterByMinimumAircrafts = async (minimum) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const minAircrafts = validateNumericInput(minimum);
    const events = await getAll();
    const filtered = events.filter(({ h: aircrafts }) => aircrafts > minAircrafts);
    logger.info(`Found ${filtered.length} occurrences with >${minAircrafts} aircraft`);
    return filtered;
  } catch (error) {
    logger.error('Failed to filter by minimum aircraft', error);
    throw error;
  }
};

/**
 * Filter occurrences by status abbreviation
 * @param {String} requestedStatus - Status abbreviation
 * @returns {Promise<Array>} Filtered occurrences
 */
const filterByStatus = async (requestedStatus) => {
  try {
    if (!PROCIV || !PROCIV.enabled) {
      logger.warning('ProCiv service is disabled in configuration');
      return null;
    }
    const events = await getAll();
    const statusId = STATUS.ABBREV_TO_ID[requestedStatus];
    const filtered = events.filter(({ ide: status }) => status === statusId);
    logger.info(`Found ${filtered.length} occurrences with status: ${requestedStatus}`);
    return filtered;
  } catch (error) {
    logger.error(`Failed to filter by status: ${requestedStatus}`, error);
    throw error;
  }
};

module.exports = {
  getAll,
  getById,
  getByCityAndLocal,
  filterByMinimumOperatives,
  filterByMinimumVehicles,
  filterByMinimumAircrafts,
  filterByStatus,
  statusIdToDesc: STATUS.ID_TO_DESC,
};
