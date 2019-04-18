/*
'Earthquakes' gets a list of earthquakes registered by IPMA, using bot api, and send to Discord (separated by sensed/non-sensed)
*/
const moment = require('moment');
const { EarthquakesApi } = require('../api');
const { channels } = require('../../config/bot');

//Returns array of all registered earthquakes
const getAll = async () => {
  const { data: earthquakes = [] } = await EarthquakesApi.getAll();

  return earthquakes;
};

//Given a certain date, return only registered earthquakes in that date
const getByDate = async (date) => {
  try {
    const earthquakes = await getAll();

    return earthquakes.filter(({ time }) => moment(time).format('L') === date);
  } catch (e) {
    throw e;
  }
};

//Get registered earthquakes from the previous day and send response to Discord
const getEarthquakes = async (client) => {
  const yesterday = moment().subtract(1, 'days');

  const events = [];
  const eventsSensed = [];
  const earthquakes = await getByDate(yesterday);

  earthquakes.forEach((earthquake) => {
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

    //Format time (hh:mm)
    const formattedTime = moment(time).format('LT');

    //Create message with 
    if (sensed) {
      //Sensed earthquakes list
      eventsSensed.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`);
    } else {
      //Non-sensed earthquakes list
      events.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
    }
  });

  
  try {
    //Send list of sensed earthquakes to Discord
    if (eventsSensed.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos sentido dia ${yesterday.format('L')}:***\n${eventsSensed.join('\n')}`);
    }

    //Send list of non-sensed earthquakes to Discord
    if (events.length > 0) {
      client.channels.get(channels.EARTHQUAKES_CHANNEL_ID).send(`***Sismos de ${yesterday.format('L')}:***\n${events.join('\n')}`);
    }
  } catch (e) {
    //
  }
};

module.exports = {
  getAll,
  getEarthquakes,
  getByDate,
};
