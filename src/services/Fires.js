const { FireApi } = require('../api');
const { MAIN_CHANNEL_ID } = require('../../config/bot');

const getForestFires = async (client) => {
  const response = await FireApi.getIF();

  const newEvents = [];
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
      ea,
    } = element;

    if (type === '1') {
      const isSevere = mans > 20 || cars + helicopters > 5;
      if (isSevere) {
        importantEvents.push(`
          __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
        `);
      } else {
        newEvents.push(`
            __${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}__
        `);
      }
    } else if (type === '2') {
      updatedEvents.push(`
          ${id} - #IF${city},${local} - ${ea} :track_next: ${status}
      `);
    } else if (type === '3') {
      updatedImportantEvents.push(`
        __**${id} - #IF${city},${local} - ${ea} :track_next: ${status}**__
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
        client.channels.get(MAIN_CHANNEL_ID).send(`
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
        client.channels.get(MAIN_CHANNEL_ID).send(`
        @here :warning: :fire: ***Ocorrência importante:***
        ${message}
        `);
      } catch (e) {
        //
      }
    } else if (type === '8') {
      const message = `
        __**${id} - #IF${city},${local} - ${ea} :track_next: ${status}**__
      `;

      try {
        client.channels.get(MAIN_CHANNEL_ID).send(`
        @here :warning: :fire: ***Atualização importante:***
        ${message}
        `);
      } catch (e) {
        //
      }
    }
  });

  if (newEvents.length > 0 || importantEvents.length > 0) {
    try {
      client.channels.get(MAIN_CHANNEL_ID).send(`
        :fire: ***Novas Ocorrências:***
        ${importantEvents.join('')}
        ${newEvents.join('')}
      `);
    } catch (e) {
      //
    }
  }

  if (updatedEvents.length > 0 || updatedImportantEvents.length > 0) {
    try {
      client.channels.get(MAIN_CHANNEL_ID).send(`
      :fire: ***Ocorrências actualizadas:***
      ${updatedImportantEvents.join('')}
      ${updatedEvents.join('')}
      `);
    } catch (e) {
      //
    }
  }
};

module.exports = {
  getForestFires,
};
