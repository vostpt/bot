const { EARTHQUAKES } = require('../config/service/servicess');
const moment = require('moment');
const { EarthquakesApi } = require('../api');

// Constants
const LOG_PREFIX = '[Earthquakes]';
const TIME_FORMAT = 'LT';
const DATE_FORMAT = 'L';

/**
 * Custom logger for Earthquake service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Format earthquake data into readable string
 * @param {Object} earthquake - Earthquake data
 * @returns {String} Formatted earthquake description
 */
const formatEarthquakeMessage = (earthquake) => {
  const {
    sensed,
    time,
    magType,
    magnitud,
    depth,
    local,
    degree,
    shakemapref,
    lat,
    lon,
    obsRegion,
  } = earthquake;

  const formattedTime = moment(time).format(TIME_FORMAT);
  const baseMessage = `${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof.`;

  if (sensed) {
    return `${baseMessage} **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`;
  }
  
  return `${baseMessage} // ${lat},${lon}`;
};

/**
 * Get all registered earthquakes
 * @returns {Promise<Array>} List of all earthquakes
 */
const getAll = async () => {
  try {
    if ( !EARTHQUAKES || !EARTHQUAKES.enabled) {
      logger.warning('Earthquakes service is disabled');
      return [];
    }
    const { data: earthquakes = [] } = await EarthquakesApi.getAll();
    logger.info(`Retrieved ${earthquakes.length} earthquakes`);
    return earthquakes;
  } catch (error) {
    logger.error('Failed to fetch earthquakes', error);
    throw error;
  }
};

/**
 * Get earthquakes for a specific date
 * @param {String} date - Date in local format
 * @returns {Promise<Array>} Filtered earthquakes
 */
const getByDate = async (date) => {
  try {
    if ( !EARTHQUAKES || !EARTHQUAKES.enabled) {
      logger.warning('Earthquakes service is disabled');
      return [];
    }
    const earthquakes = await getAll();
    const filtered = earthquakes.filter(({ time }) => 
      moment(time).format(DATE_FORMAT) === date
    );
    logger.info(`Found ${filtered.length} earthquakes for date ${date}`);
    return filtered;
  } catch (error) {
    logger.error(`Failed to get earthquakes for date ${date}`, error);
    throw error;
  }
};

/**
 * Get earthquakes separated by sensed/non-sensed
 * @param {String} [day] - Target date (defaults to yesterday)
 * @returns {Promise<Object>} Separated earthquake lists
 */
const getEarthquakes = async (day = moment().subtract(1, 'days').format(DATE_FORMAT)) => {
  try {
    if ( !EARTHQUAKES || !EARTHQUAKES.enabled) {
      logger.warning('Earthquakes service is disabled');
      return [];
    }
    logger.info(`Getting earthquakes for ${day}`);
    const earthquakes = await getByDate(day);
    
    const result = earthquakes.reduce((acc, earthquake) => {
      const formattedMessage = formatEarthquakeMessage(earthquake);
      
      if (earthquake.sensed) {
        acc.eventsSensed.push(formattedMessage);
      } else {
        acc.events.push(formattedMessage);
      }
      
      return acc;
    }, { events: [], eventsSensed: [] });

    logger.info(`Processed ${earthquakes.length} earthquakes: ${result.eventsSensed.length} sensed, ${result.events.length} non-sensed`);
    return result;
  } catch (error) {
    logger.error(`Failed to process earthquakes for ${day}`, error);
    throw error;
  }
};

module.exports = {
  getAll,
  getByDate,
  getEarthquakes,
};
