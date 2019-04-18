/*
'Warnings' gets a list of updated meteo warnings issued by IPMA, using bot api, and send it to Discord and Twitter

Note that will be sent one message including all warnings to Discord, while one message per warning will be sent to Twitter
*/

const moment = require('moment');
const { WarningsApi } = require('../api');
const { clientTwitter } = require('./Twitter');
const { channels } = require('../../config/bot');

const iconsMap = new Map([
  [':dash:', '🌬'],
  [':sunny:️:thermometer:', '☀🌡'],
  [':snowflake:️:thermometer:', '❄🌡'],
  [':cloud_rain:', '🌧'],
  [':fog:', '🌫'],
  [':snowflake:', '❄'],
  [':ocean:', '🌊'],
  [':thunder_cloud_rain:', '⛈'],
]);

const DATE_FORMATS = {
  first: 'YYYY-MM-DD H:mm',
  second: 'YYYY-MM-DD',
};

//Returns array of updated meteo warnings (even there's no issued warnings)
const getAll = async () => {
  const { data: warnings = [] } = await WarningsApi.getAll();

  return warnings;
};

//Get updated meteo warnings,  data and send response to Discord
const getWarnings = async (client) => {
  const warnings = await getAll();

  let respnovos = '';
  let resptwitter = '';

  warnings.forEach((warning) => {
    const {
      icon,
      tipo: type = '',
      inicio: begin,
      fim: end,
      nivel: level,
      locais: places = [],
    } = warning;

    let primeiro = 0;
    resptwitter = '';

    const weatherType = type === 'Precipitação' ? 'Chuva' : type.replace(' ', '');

    let inicio = '';
    let fim = '';

    //Format warning time and date
    const formattedBegin = moment(begin, DATE_FORMATS.first).format(DATE_FORMATS.second);
    const formattedEnd = moment(end, DATE_FORMATS.first).format(DATE_FORMATS.second);
    const formattedNow = moment().format(DATE_FORMATS.second);
    const formattedTomorrow = moment(formattedNow).add('1', 'days');

    const noDiff = moment(begin).diff(end) === 0;

    //Parse begin and end time/date from warning
    if (noDiff) {
      if (formattedBegin === formattedNow) {
        inicio = `${moment(begin, DATE_FORMATS.first).format('HH:mm')}h`;
        fim = `${moment(end, DATE_FORMATS.first).format('HH:mm')}h de hoje,`;
      } else if (formattedBegin === formattedTomorrow) {
        inicio = `${moment(begin, DATE_FORMATS.first).format('HH:mm')}h`;
        fim = `${moment(end, DATE_FORMATS.first).format('HH:mm')}h de amanhã,`;
      }
    } else {
      if (formattedBegin === formattedNow) {
        inicio = `${moment(begin, DATE_FORMATS.first).format('HH:mm')}h de hoje`;
      } else if (formattedBegin === formattedTomorrow) {
        inicio = `${moment(begin, DATE_FORMATS.first).format('HH:mm')}h de amanhã`;
      } else {
        inicio = moment(begin, DATE_FORMATS.first).format('YYYY-MM-DD HH:mm');
      }

      if (formattedEnd === formattedNow) {
        fim = `${moment(end, DATE_FORMATS.first).format('HH:mm')}h de hoje,`;
      } else if (formattedEnd === formattedTomorrow) {
        fim = `${moment(end, DATE_FORMATS.first).format('HH:mm')}h de amanhã,`;
      } else {
        fim = moment(end, DATE_FORMATS.first).format('YYYY-MM-DD HH:mm');
      }
    }

    //Create message to Discord
    respnovos += `:information_source: :warning: ${icon} `;
    respnovos += `#Aviso${level} devido a `;
    respnovos += `#${weatherType} entre as `;
    respnovos += `${inicio} e as `;
    respnovos += `${fim} para os distritos de `;

    //Create message to Twitter
    resptwitter += `ℹ️⚠️${iconsMap.get(icon)} `;
    resptwitter += `#Aviso${level} devido a `;
    resptwitter += `#${weatherType} entre as `;
    resptwitter += `${inicio} e as `;
    resptwitter += `${fim} para os distritos de `;

    //Add districts included in warning to both Discord and Twitter message
    places.forEach(({ local }) => {
      if (primeiro === 0) {
        respnovos += `#${local}`;
        resptwitter += `#${local}`;
      } else if (places.length - 1 === primeiro) {
        respnovos += `, e #${local}`;
        resptwitter += `, e #${local}`;
      } else {
        respnovos += `, #${local}`;
        resptwitter += `, #${local}`;
      }
      primeiro += 1;
    });

    //
    respnovos += ` ${icon} :warning: :information_source:\n\n`;
    resptwitter += ` ${iconsMap.get(icon)}⚠️ℹ️`;

    //Send message to Twitter
    if (clientTwitter) {
      clientTwitter.post('statuses/update', { status: resptwitter });
    }
  });

  //Send message to Discord
  if (respnovos !== '') {
    try {
      client.channels.get(channels.WARNINGS_CHANNEL_ID).send(`***Novos Alertas:***\n${respnovos}`);
    } catch (e) {
      //
    }
  }
};

module.exports = {
  getAll,
  getWarnings,
};
