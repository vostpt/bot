const { FIRES } = require('../../config/services');
const { FireApi } = require('../api');
const { channels } = require('../../config/bot');
const { isSevere } = require('../helpers');

// Constants
const LOG_PREFIX = '[Fires]';
const FIRE_MAP_URL = 'http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/RCM24_conc.jpg';

const EVENT_TYPES = {
  GENERAL: '1',
  UPDATE: '2',
  RELEVANT_UPDATE: '3',
  SEVERITY_UP: '4',
  SEVERITY_DOWN: '5',
  RELEVANT_EVENT: '6',
  RELEVANT_EVENT_WARN_ALL: '7',
  RELEVANT_UPDATE_WARN_ALL: '8',
};

/**
 * Custom logger for Fire service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Format fire event message
 * @param {Object} fire - Fire event data
 * @returns {String} Formatted message
 */
const formatFireMessage = (fire) => {
  const {
    id,
    d: date,
    l: city,
    s: local,
    o: operatives,
    t: vehicles,
    a: aircrafts,
    e: status,
  } = fire;

  return `${date} - ${id} - #IR${city}, #${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;
};

/**
 * Process and send fire events to Discord
 * @param {Object} client - Discord client
 * @param {Array} fires - Array of fire events
 */
const processFires = async (client, fires) => {
  const events = {
    new: [],
    newRelevant: [],
    updated: [],
    updatedRelevant: [],
  };

  for (const fire of fires) {
    const {
      id,
      l: city,
      s: local,
      o: operatives,
      t: vehicles,
      a: aircrafts,
      e: status,
      tipo: type,
      ea: previousStatus,
    } = fire;

    try {
      const channel = client.channels.get(channels.FIRES_CHANNEL_ID);
      
      switch (type) {
        case EVENT_TYPES.GENERAL: {
          const msg = formatFireMessage(fire);
          if (isSevere(fire)) {
            events.newRelevant.push(`__**${msg}**__`);
          } else {
            events.new.push(msg);
          }
          break;
        }
        case EVENT_TYPES.UPDATE: {
          const msg = `${id} - #IR${city}, #${local} - ${previousStatus} :track_next: ${status}`;
          events.updated.push(msg);
          break;
        }
        case EVENT_TYPES.RELEVANT_UPDATE: {
          const msg = `${id} - #IR${city}, #${local} - ${previousStatus} :track_next: ${status}`;
          events.updatedRelevant.push(`__**${msg}**__`);
          break;
        }
        case EVENT_TYPES.SEVERITY_UP: {
          const msg = `${id} - #IR${city}, #${local} - Subiu para ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter:`;
          events.updatedRelevant.push(`__**${msg}**__`);
          break;
        }
        case EVENT_TYPES.SEVERITY_DOWN: {
          const msg = `${id} - #IR${city}, #${local} - Desceu para ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter:`;
          events.updatedRelevant.push(`__**${msg}**__`);
          break;
        }
        case EVENT_TYPES.RELEVANT_EVENT: {
          const msg = `${id} - #IR${city},${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;
          await channel.send(`:warning: :fire: ***Ocorrência relevante:***\n__**${msg}**__`);
          break;
        }
        case EVENT_TYPES.RELEVANT_EVENT_WARN_ALL: {
          const msg = `${id} - #IR${city},${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;
          await channel.send(`@here :warning: :fire: ***Ocorrência relevante:***\n__**${msg}**__`);
          break;
        }
        case EVENT_TYPES.RELEVANT_UPDATE_WARN_ALL: {
          const msg = `${id} - #IR${city},${local} - ${previousStatus} :track_next: ${status}`;
          await channel.send(`@here :warning: :fire: ***Atualização relevante:***\n__**${msg}**__`);
          break;
        }
      }
    } catch (error) {
      logger.error(`Failed to process fire event ${id}`, error);
    }
  }

  // Send grouped messages
  try {
    const channel = client.channels.get(channels.FIRES_CHANNEL_ID);

    if (events.new.length > 0 || events.newRelevant.length > 0) {
      await channel.send(`:fire: ***Novas Ocorrências:***\n${events.newRelevant.join('\n')}\n${events.new.join('\n')}`);
    }

    if (events.updated.length > 0 || events.updatedRelevant.length > 0) {
      await channel.send(`:fire: ***Ocorrências actualizadas:***\n${events.updatedRelevant.join('\n')}\n${events.updated.join('\n')}`);
    }
  } catch (error) {
    logger.error('Failed to send fire updates to Discord', error);
  }
};

/**
 * Get fires by district
 * @param {String} district - District name
 * @returns {Promise<Array>} List of fires
 */
const getByDistrict = async (district) => {
  try {
    if (!FIRES || !FIRES.enabled) {
      logger.warning('Fire service is disabled in configuration');
      return [];
    }
    const { data: fires = [] } = await FireApi.getByDistrict(district);
    logger.info(`Retrieved ${fires.length} fires for district: ${district}`);
    return fires;
  } catch (error) {
    logger.error(`Failed to get fires for district: ${district}`, error);
    throw error;
  }
};

/**
 * Get important fires
 * @returns {Promise<Array>} List of important fires
 */
const getImportantForestFires = async () => {
  try {
    if (!FIRES || !FIRES.enabled) {
      logger.warning('Fire service is disabled in configuration');
      return [];
    }
    const { data: fires = [] } = await FireApi.getImportantIF();
    logger.info(`Retrieved ${fires.length} important fires`);
    return fires;
  } catch (error) {
    logger.error('Failed to get important fires', error);
    throw error;
  }
};

/**
 * Get and process all forest fires
 * @param {Object} client - Discord client
 */
const getForestFires = async (client) => {
  try {
    if (!FIRES || !FIRES.enabled) {
      logger.warning('Fire service is disabled in configuration');
      return [];
    }
    const { data: fires = [] } = await FireApi.getIF();
    logger.info(`Retrieved ${fires.length} forest fires`);
    
    if (fires.length > 0) {
      await processFires(client, fires);
    }
  } catch (error) {
    logger.error('Failed to get forest fires', error);
    throw error;
  }
};

/**
 * Get fire risk map URL
 * @returns {String} Map URL
 */
const getMap = () => FIRE_MAP_URL;

module.exports = {
  getByDistrict,
  getForestFires,
  getImportantForestFires,
  getMap,
};
