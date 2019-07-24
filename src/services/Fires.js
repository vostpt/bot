const { FireApi } = require('../api');
const { channels } = require('../../config/bot');
const { isSevere } = require('../helpers');

const EVENT_TYPES = {
  GENERAL: '1',
  UPDATE: '2',
  IMPORTANT_UPDATE: '3',
  SEVERITY_UP: '4',
  SEVERITY_DOWN: '5',
  IMPORTANT_EVENT: '6',
  IMPORTANT_EVENT_WARN_ALL: '7',
  IMPORTANT_UPDATE_WARN_ALL: '8',
};

/**
 * Get fire list in a given district
 *
 * @param {String} district
 * @returns {Array} fires
 */
const getByDistrict = async (district) => {
  const { data: fires = [] } = await FireApi.getByDistrict(district);

  return fires;
};

/**
 * Get important fires' list
 *
 * @param {Client} client
 */

const getImportantForestFires = async () => {
  const { data: fires = [] } = await FireApi.getImportantIF();

  return fires;
};

/**
 * Get fire list
 *
 * @param {Client} client
 */
const getForestFires = async (client) => {
  const { data: fires = [] } = await FireApi.getIF();

  const events = [];
  const importantEvents = [];

  const updatedEvents = [];
  const updatedImportantEvents = [];

  fires.forEach((fire) => {
    const {
      id,
      d: date,
      l: city,
      s: local,
      o: operatives,
      t: vehicles,
      a: aircrafts,
      e: status,
      tipo: type,
      ea: previousStatus,
    } = fire;

    switch (type) {
      case EVENT_TYPES.GENERAL: {
        const msg = `${date} - ${id} - #IF${city}, #${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

        if (isSevere(fire)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
        break;
      }
      case EVENT_TYPES.UPDATE: {
        updatedEvents.push(`${id} - #IF${city}, #${local} - ${previousStatus} :track_next: ${status}`);
        break;
      }
      case EVENT_TYPES.IMPORTANT_UPDATE: {
        updatedImportantEvents.push(`__**${id} - #IF${city}, #${local} - ${previousStatus} :track_next: ${status}**__`);
        break;
      }
      case EVENT_TYPES.SEVERITY_UP: {
        updatedImportantEvents.push(`__**${id} - #IF${city}, #${local} - Subiu para ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter:**__`);
        break;
      }
      case EVENT_TYPES.SEVERITY_DOWN: {
        updatedImportantEvents.push(`__**${id} - #IF${city}, #${local} - Desceu para ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter:**__`);
        break;
      }
      case EVENT_TYPES.IMPORTANT_EVENT: {
        const msg = `__**${id} - #IF${city},${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`:warning: :fire: ***Ocorrência importante:***\n${msg}`);
        break;
      }
      case EVENT_TYPES.IMPORTANT_EVENT_WARN_ALL: {
        const msg = `__**${id} - #IF${city},${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`@here :warning: :fire: ***Ocorrência importante:***\n${msg}`);
        break;
      }
      case EVENT_TYPES.IMPORTANT_UPDATE_WARN_ALL: {
        const msg = `__**${id} - #IF${city},${local} - ${previousStatus} :track_next: ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`@here :warning: :fire: ***Atualização importante:***\n${msg}`);
        break;
      }
      default: {
        break;
      }
    }
  });

  if (events.length > 0 || importantEvents.length > 0) {
    client.channels.get(channels.FIRES_CHANNEL_ID).send(`:fire: ***Novas Ocorrências:***\n${importantEvents.join('\n')}\n${events.join('\n')}`);
  }

  if (updatedEvents.length > 0 || updatedImportantEvents.length > 0) {
    client.channels.get(channels.FIRES_CHANNEL_ID).send(`:fire: ***Ocorrências actualizadas:***\n${updatedImportantEvents.join('\n')}\n${updatedEvents.join('\n')}`);
  }
};

const getMap = () => 'http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/RCM24_conc.jpg';

module.exports = {
  getByDistrict,
  getForestFires,
  getImportantForestFires,
  getMap,
};
