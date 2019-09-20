const { FireApi } = require('../api');
const { channels } = require('../../config/bot');
const { isSevere } = require('../helpers');
const { retweetFogosPtStatTweet } = require('./Twitter');

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
  const relevantEvents = [];

  const updatedEvents = [];
  const updatedRelevantEvents = [];

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
          relevantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
        break;
      }
      case EVENT_TYPES.UPDATE: {
        updatedEvents.push(`${id} - #IF${city}, #${local} - ${previousStatus} :track_next: ${status}`);
        break;
      }
      case EVENT_TYPES.RELEVANT_UPDATE: {
        updatedRelevantEvents.push(`__**${id} - #IF${city}, #${local} - ${previousStatus} :track_next: ${status}**__`);
        break;
      }
      case EVENT_TYPES.SEVERITY_UP: {
        updatedRelevantEvents.push(`__**${id} - #IF${city}, #${local} - Subiu para ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter:**__`);
        break;
      }
      case EVENT_TYPES.SEVERITY_DOWN: {
        updatedRelevantEvents.push(`__**${id} - #IF${city}, #${local} - Desceu para ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter:**__`);
        break;
      }
      case EVENT_TYPES.RELEVANT_EVENT: {
        const msg = `__**${id} - #IF${city},${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`:warning: :fire: ***Ocorrência relevante:***\n${msg}`);
        break;
      }
      case EVENT_TYPES.RELEVANT_EVENT_WARN_ALL: {
        const msg = `__**${id} - #IF${city},${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`@here :warning: :fire: ***Ocorrência relevante:***\n${msg}`);
        break;
      }
      case EVENT_TYPES.RELEVANT_UPDATE_WARN_ALL: {
        const msg = `__**${id} - #IF${city},${local} - ${previousStatus} :track_next: ${status}**__`;
        client.channels.get(channels.FIRES_CHANNEL_ID).send(`@here :warning: :fire: ***Atualização relevante:***\n${msg}`);
        break;
      }
      default: {
        break;
      }
    }
  });

  if (events.length > 0 || relevantEvents.length > 0) {
    client.channels.get(channels.FIRES_CHANNEL_ID).send(`:fire: ***Novas Ocorrências:***\n${relevantEvents.join('\n')}\n${events.join('\n')}`);
  }

  if (updatedEvents.length > 0 || updatedRelevantEvents.length > 0) {
    client.channels.get(channels.FIRES_CHANNEL_ID).send(`:fire: ***Ocorrências actualizadas:***\n${updatedRelevantEvents.join('\n')}\n${updatedEvents.join('\n')}`);
  }
};

const getMap = () => 'http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/RCM24_conc.jpg';

const tweetFogosPt = async () => {
  const result = await FireApi.tweetFogosPt();

  const beginAfterStr = 'SENDING =>';
  const firstPos = result.lastIndexOf(beginAfterStr) + beginAfterStr.length;

  const endBeforeStr = ' https://fogos.pt #FogosPT';
  const lastPos = result.lastIndexOf(endBeforeStr);

  const tweetWithoutLink = result.slice(firstPos, lastPos);

  retweetFogosPtStatTweet(tweetWithoutLink);
};

module.exports = {
  getByDistrict,
  getForestFires,
  getImportantForestFires,
  getMap,
  tweetFogosPt,
};
