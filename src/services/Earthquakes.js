/**
 * Earthquakes gets a list of earthquakes registered by IPMA,
 * using IPMA API, and send to Discord (separated by sensed/non-sensed)
 * and Twitter (only sensed)
 */
const moment = require('moment');
const { db, Op } = require('../database/models');
const { EarthquakesApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');

/**
 * Create message for each earthquake, and return array with formatted strings
 *
 * @param {Object} earthquakeArray
 * @param {Number} arrayZone
 */
const getEarthquakeArray = (earthquakeArray, arrayZone = null) => {
  const events = [];
  const eventsSensed = [];

  const orderedEarthquakes = earthquakeArray.sort((a, b) => {
    if (a.time > b.time) {
      return 1;
    }

    if (a.time < b.time) {
      return -1;
    }

    return 0;
  });

  orderedEarthquakes.forEach((earthquake) => {
    const {
      sensed,
      time,
      magType,
      magnitud,
      depth,
      local,
      degree,
      shakemapref,
      shakemapid,
      zone,
      lat,
      lon,
      obsRegion,
    } = earthquake;

    // Format time (hh:mm)
    const formattedTimeUtc = moment.utc(time).format('LT');

    const [formattedTimeLocal, timeZone] = zone === 7 || arrayZone === 7
      ? [moment.utc(time).tz('Europe/Lisbon').format('LT'), 'PCont+Mad']
      : [moment.utc(time).tz('Atlantic/Azores').format('LT'), 'Açores'];

    // Add earthquake to the correct list
    if (sensed) {
      const message = `${formattedTimeUtc}h UTC / ${formattedTimeLocal}h ${timeZone} - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** // ${lat},${lon}`;

      // Add to list of sensed earthquake
      eventsSensed.push({
        message,
        shakemapid,
        shakemapref,
        time,
      });
    } else {
      // Add to list of non-sensed earthquakes list
      events.push(`${formattedTimeUtc}h UTC / ${formattedTimeLocal}h ${timeZone} - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
    }
  });

  return {
    events,
    eventsSensed,
  };
};

/**
 * Get earthquakes and filters by a specific date
 *
 * @param {Object} date
 * @returns {Object}
 * @async
 */
const getByDate = async (date) => {
  try {
    const searchDay = date.format('YYYY-MM-DD');
    const nextDay = date.add('1', 'days').format('YYYY-MM-DD');

    const result = await db.Earthquakes.findAll({
      where: {
        time: {
          [Op.between]: [searchDay, nextDay],
        },
      },
    });

    return getEarthquakeArray(result.map(earthquake => earthquake.dataValues));
  } catch (e) {
    throw e;
  }
};

/**
 * Send new earthquakes to Discord and Twitter (if a sensed earthquake occurred)
 *
 * @async
 * @param {Object} client
 * @param {Number} zone
 * @param {Array} newEarthquakes
 */
const sendEarthquakes = async (client, zone, newEarthquakes = []) => {
  const { events, eventsSensed } = getEarthquakeArray(newEarthquakes, zone);

  const [channel, twitterAccount] = zone === 7
    ? [client.channels.get(channels.EARTHQUAKES_CHANNEL_ID), 'main']
    : [client.channels.get(channels.EARTHQUAKES_AZ_CHANNEL_ID), 'az'];

  if (eventsSensed.length > 0) {
    const twitterThread = [];
    const discordThread = [];

    eventsSensed.forEach((earthquake) => {
      const day = moment(earthquake.time).format('DDMMMYY').toUpperCase();

      const shakemapImg = `http://shakemap.ipma.pt/${earthquake.shakemapid}/download/intensity.jpg`;

      discordThread.push(`${day} - ${earthquake.message}\n${shakemapImg}`);

      twitterThread.push({
        status: `ℹ️⚠️#ATerraTreme\n\n${day} - ${earthquake.message.replace(/\*/g, '')}\nShakemap: ${earthquake.shakemapref}\n\n⚠️ℹ️`,
        media: earthquake.image,
      });
    });

    const message = `***Novo(s) sismo(s) sentido(s):***\n${discordThread.join('\n')}`;

    sendMessageToChannel(channel, message);

    twitterThread.push({
      status: 'ℹ️⚠️#ATerraTreme\n\nSentiste este(s) sismo(s)?\nReporta: http://survey.ipma.pt/index.php/2019/\n\n⚠️ℹ️',
    });

    uploadThreadTwitter(twitterThread, undefined, twitterAccount);
  }

  if (events.length > 0) {
    const message = `***Novo(s) sismo(s):***\n${events.join('\n')}`;
    sendMessageToChannel(channel, message);
  }
};

/**
 * Check if an earthquake is present in local DB
 * Assumes that occurrence time is unique
 *
 * @param {Object} earthquake
 */
const earthquakeNotInDb = earthquake => db.Earthquakes.findOne({
  attributes: ['time'],
  where: {
    time: earthquake.time,
  },
})
  .then(result => result === null);

/**
 * Updates database with new earthquakes
 *
 * @async
 * @param {Object} client
 * @param {number} zone
 */

const getEarthquakes = async (client, zone) => {
  const { data } = await EarthquakesApi.getIpma(zone);

  const newSearchResults = await Promise.all(data.map(earthquake => earthquakeNotInDb(earthquake)));

  const newEarthquakes = data.filter(((_earthquake, i) => newSearchResults[i]));

  try {
    db.sequelize.transaction((t) => {
      const promises = [];

      for (let i = 0; i < newEarthquakes.length; i += 1) {
        const singlePromise = db.Earthquakes.create({
          time: newEarthquakes[i].time,
          dataUpdate: newEarthquakes[i].dataUpdate,
          zone,
          degree: newEarthquakes[i].degree,
          magType: newEarthquakes[i].magType,
          magnitud: newEarthquakes[i].magnitud,
          depth: newEarthquakes[i].depth,
          obsRegion: newEarthquakes[i].obsRegion,
          local: newEarthquakes[i].local,
          lat: newEarthquakes[i].lat,
          lon: newEarthquakes[i].lon,
          sensed: newEarthquakes[i].sensed,
          shakemapid: newEarthquakes[i].shakemapid,
          shakemapref: newEarthquakes[i].shakemapref,
        }, { transaction: t });
        promises.push(singlePromise);
      }

      return Promise.all(promises);
    });
  } catch (e) {
    // Revert transaction
  }

  const earthquakesToSend = newEarthquakes.filter(earthquake => moment(earthquake.time).isAfter(moment().subtract(1, 'days')));

  return sendEarthquakes(client, zone, earthquakesToSend);
};

/**
 * Delete earthquakes from database that occurred
 * earlier than specified number of days
 *
 * @async
 * @param {number} days
 */

const deleteOldEarthquakes = async (days) => {
  try {
    const dateLimit = moment().subtract(days.toString(), 'days').format('YYYY-MM-DD');

    db.sequelize.transaction((t) => {
      db.Earthquakes.destroy({
        where: {
          time: {
            [Op.lte]: dateLimit,
          },
        },
      }, { transaction: t });
    });
  } catch (e) {
    // Revert transaction
  }
};

module.exports = {
  getByDate,
  getEarthquakes,
  deleteOldEarthquakes,
};
