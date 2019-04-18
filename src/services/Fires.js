const { FireApi } = require('../api');
const { channels } = require('../../config/bot');

const getByDistrict = async (district) => {
  const { data: fires = [] } = await FireApi.getByDistrict(district);

  return fires;
};

const getForestFires = async (client) => {
  const response = await FireApi.getIF();

  const events = [];
  const importantEvents = [];

  const updatedEvents = [];
  const updatedImportantEvents = [];

  response.data.forEach((element) => {
    const {
      id,
      d: date,
      l: city,
      s: local,
      o: mans,
      t: cars,
      a: helicopters,
      e: status,
      tipo: type,
      ea: previousStatus,
    } = element;

    if (type === '1') {
      const isSevere = mans > 20 || cars + helicopters > 5;
      if (isSevere) {
        importantEvents.push(`
          __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
        `);
      } else {
        events.push(`
            __${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}__
        `);
      }
    } else if (type === '2') {
      updatedEvents.push(`
          ${id} - #IF${city},${local} - ${previousStatus} :track_next: ${status}
      `);
    } else if (type === '3') {
      updatedImportantEvents.push(`
        __**${id} - #IF${city},${local} - ${previousStatus} :track_next: ${status}**__
      `);
    } else if (type === '4') {
      updatedImportantEvents.push(`
        __**${id} - #IF${city},${local} - Subiu para ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
      `);
    } else if (type === '5') {
      updatedImportantEvents.push(`
        __**${id} - #IF${city},${local} - Desceu para ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
      `);
    } else if (type === '6') {
      const message = `
        __**${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
      `;
      try {
        client.channels.get(channels.MAIN_CHANNEL_ID).send(`
        :warning: :fire: ***Ocorrência importante:***
        ${message}
        `);
      } catch (e) {
        //
      }
    } else if (type === '7') {
      const message = `
        __**${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
      `;
      try {
        client.channels.get(channels.MAIN_CHANNEL_ID).send(`
        @here :warning: :fire: ***Ocorrência importante:***
        ${message}
        `);
      } catch (e) {
        //
      }
    } else if (type === '8') {
      const message = `
        __**${id} - #IF${city},${local} - ${previousStatus} :track_next: ${status}**__
      `;

      try {
        client.channels.get(channels.MAIN_CHANNEL_ID).send(`
        @here :warning: :fire: ***Atualização importante:***
        ${message}
        `);
      } catch (e) {
        //
      }
    }
  });

  if (events.length > 0 || importantEvents.length > 0) {
    try {
      client.channels.get(channels.MAIN_CHANNEL_ID).send(`
        :fire: ***Novas Ocorrências:***
        ${importantEvents.join('')}
        ${events.join('')}
      `);
    } catch (e) {
      //
    }
  }

  if (updatedEvents.length > 0 || updatedImportantEvents.length > 0) {
    try {
      client.channels.get(channels.MAIN_CHANNEL_ID).send(`
      :fire: ***Ocorrências actualizadas:***
      ${updatedImportantEvents.join('')}
      ${updatedEvents.join('')}
      `);
    } catch (e) {
      //
    }
  }
};

const getMap = () => 'http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/RCM24_conc.jpg';

module.exports = {
  getByDistrict,
  getForestFires,
  getMap,
};
