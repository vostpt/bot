/**
 * Ipma' gets a list of updated meteo warnings issued by IPMA,
 * and send it to Twitter
 * Note that will be sent to Twitter one thread per country with new warnings
 */

const { DateTime } = require('luxon');
const moment = require('moment');
const { IpmaApi, WarningsApi } = require('../api');
const { db, Op } = require('../database/models');
const { locale } = require('../../config/locale');

const { uploadThreadTwitter } = require('./Twitter');
const { sendMessageToChannel } = require('./Discord');
const { channels } = require('../../config/bot');
const { baseImagesURL } = require('../../config/api');
const { removeAccent, splitMessageString } = require('../helpers');
const { sendMessagesTelegram } = require('./Telegram');
const { telegramKeys } = require('../../config/telegram');
const { sendPostMastodon } = require('./Mastodon');
const { postMessageFacebook } = require('./Facebook');
 
 const warningTypes = {
   'Tempo Frio': {
     strType: 'TempoFrio',
     emoji: '❄🌡',
     emojiDiscord: ':snowflake:️:thermometer:',
   },
   'Tempo Quente': {
     strType: 'TempoQuente',
     emoji: '☀🌡',
     emojiDiscord: ':sunny:️:thermometer:',
   },
   'Precipitação': {
     strType: 'Chuva',
     emoji: '🌧',
     emojiDiscord: ':cloud_rain:',
   },
   'Nevoeiro': {
     strType: 'Nevoeiro',
     emoji: '🌫',
     emojiDiscord: ':fog:',
   },
   'Neve': {
     strType: 'Neve',
     emoji: '❄',
     emojiDiscord: ':snowflake:',
   },
   'Agitação Marítima': {
     strType: 'AgitaçãoMarítima',
     emoji: '🌊',
     emojiDiscord: ':ocean:',
   },
   'Trovoada': {
     strType: 'Trovoada',
     emoji: '⛈',
     emojiDiscord: ':thunder_cloud_rain:',
   },
   'Vento': {
      strType: 'Vento',
      emoji: '🌬️',
      emojiDiscord: ':dash:',
    },
 };
 
 const regionsData = {
   ACE: {
     strRegion: 'GrupoCentral',
     zone: 'azores',
   },
   AOC: {
    strRegion: 'GrupoOcidental',
    zone: 'azores',
   },
   AOR: {
    strRegion: 'GrupoOriental',
    zone: 'azores',
   },
   AVR: {
    strRegion: 'Aveiro',
    zone: 'mainland',
   },
   BJA: {
    strRegion: 'Beja',
    zone: 'mainland',
   },
   BRG: {
    strRegion: 'Braga',
    zone: 'mainland',
   },
   BGC: {
    strRegion: 'Bragança',
    zone: 'mainland',
   },
   CBO: {
    strRegion: 'CasteloBranco',
    zone: 'mainland',
   },
   CBR: {
    strRegion: 'Coimbra',
    zone: 'mainland',
   },
   EVR: {
    strRegion: 'Évora',
    zone: 'mainland',
   },
   FAR: {
    strRegion: 'Faro',
    zone: 'mainland',
   },
   GDA: {
    strRegion: 'Guarda',
    zone: 'mainland',
   },
   LRA: {
    strRegion: 'Leiria',
    zone: 'mainland',
   },
   LSB: {
    strRegion: 'Lisboa',
    zone: 'mainland',
   },
   MCN: {
    strRegion: 'CostaNorte',
    zone: 'madeira',
   },
   MCS: {
    strRegion: 'CostaSul',
    zone: 'madeira',
   },
   MPS: {
    strRegion: 'PortoSanto',
    zone: 'madeira',
   },
   MRM: {
    strRegion: 'RegiõesMontanhosas',
    zone: 'madeira',
   },
   PTG: {
    strRegion: 'Portalegre',
    zone: 'mainland',
   },
   PTO: {
    strRegion: 'Porto',
    zone: 'mainland',
   },
   STM: {
    strRegion: 'Santarém',
    zone: 'mainland',
   },
   STB: {
    strRegion: 'Setúbal',
    zone: 'mainland',
   },
   VCT: {
    strRegion: 'VianaDoCastelo',
    zone: 'mainland',
   },
   VRL: {
    strRegion: 'VilaReal',
    zone: 'mainland',
   },
   VIS: {
    strRegion: 'Viseu',
    zone: 'mainland',
   },
 };
 
 const warningSeverities = {
   yellow: 'Amarelo',
   orange: 'Laranja',
   red: 'Vermelho',
 };

 const DATE_FORMATS = {
  first: 'YYYY-MM-DD H:mm',
 };

 moment.locale(locale);

 moment.updateLocale(locale, {
   calendar: {
     lastDay: 'HH:mm[h de ontem]',
     sameDay: 'HH:mm[h de hoje]',
     nextDay: 'HH:mm[h de amanhã]',
     lastWeek: 'HH:mm[h do dia]',
     nextWeek: 'HH:mm[h do dia]',
     sameElse: 'HH:mm[h do dia]',
   },
 });

  /**
  * Check if a warning is present in local DB
  * And if a warning has ended
  *
  * @param {Object} warning
  */
 const filterWarn = async (warning) => {
   const now = DateTime.now();
   const end = DateTime.fromISO(warning.end);
 
   if (end < now) {
     return false;
   }
 
   const result = await db.IpmaWarnings.findOne({
     attributes: [
       'idAreaAviso',
       'awarenessTypeName',
       'startTime',
       'endTime',
       'awarenessLevelID',
     ],
     where: {
      idAreaAviso: warning.idAreaAviso,
       awarenessTypeName: warning.awarenessTypeName,
       startTime: {
         [Op.lte]: DateTime.fromISO(warning.startTime).toJSDate(),
       },
       endTime: warning.endTime,
       awarenessLevelID: warning.awarenessLevelID,
     },
   });
 
   return (result === null);
 };
 
 /**
  * Tweet new warnings
  *
  * @param {Object} newWarnings
  */
 const tweetNewWarnings = async (client, zone, newWarnings) => {
   const joinNewWarn = [];

   let strDiscord = '';

   const tlgMessages = [];
 
   await newWarnings.forEach((newWarn) => {
     const resIndex = joinNewWarn.findIndex((warn) => (
       warn.awarenessTypeName === newWarn.awarenessTypeName
         && warn.startTime === newWarn.startTime
         && warn.endTime === newWarn.endTime
         && warn.awarenessLevelID === newWarn.awarenessLevelID));
 
     if (resIndex > -1) {
       const resDupReg = joinNewWarn[resIndex].regions.find((region) => region === newWarn.region);
 
       if (!resDupReg) {
         joinNewWarn[resIndex].regions.push(newWarn.idAreaAviso);
       }
     } else {
       joinNewWarn.push({
         awarenessTypeName: newWarn.awarenessTypeName,
         startTime: newWarn.startTime,
         endTime: newWarn.endTime,
         awarenessLevelID: newWarn.awarenessLevelID,
         regions: [newWarn.idAreaAviso],
       });
     }
   });
 
   joinNewWarn.map((warning) => {
     const {
       awarenessTypeName,
       startTime,
       endTime,
       awarenessLevelID,
       regions,
     } = warning;
    
     const {
       strType,
       emoji,
       emojiDiscord,
     } = warningTypes[awarenessTypeName];

     const level = warningSeverities[awarenessLevelID.toLowerCase()];

     // Format warning time and date
     const actualTime = moment();

     const beginTimeObj = moment(startTime, DATE_FORMATS.first);
     const endTimeObj = moment(endTime, DATE_FORMATS.first);

     const strBeginHour = beginTimeObj.format('HH:mm');

     const strBeginDate = beginTimeObj.format('DDMMMYY').toUpperCase();
     const strEndDate = endTimeObj.format('DDMMMYY').toUpperCase();

     const getTime = (() => {
       if (beginTimeObj.isBefore(actualTime)) {
         return `até às ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
       }

       if (beginTimeObj.isSame(endTimeObj, 'day')) {
         return `entre as ${strBeginHour}h e as ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
       }

       return `entre as ${beginTimeObj.calendar(actualTime)} ${strBeginDate} e as ${endTimeObj.calendar(actualTime)} ${strEndDate}`;
     });

     const numRegions = regions.length;

     const getDistrictList = (() => {
       let strDistrictList = '';

       if (numRegions === 1) {
         const [ region ] = regions;

         strDistrictList += `#${regionsData[region].strRegion}`;
       } else {
         regions.forEach((region, index) => {
           switch (numRegions - index) {
             case 1:
               strDistrictList += `e #${regionsData[region].strRegion}`;
               break;
             case 2:
               strDistrictList += `#${regionsData[region].strRegion} `;
               break;
             default:
               strDistrictList += `#${regionsData[region].strRegion}, `;
           }
         });
       }

       return strDistrictList;
     });

     const getDistrictStr = ((startSentence) => {
       const startStr = startSentence
         ? ''
         : 'para ';

       switch (zone) {
         case 'mainland':
           if (numRegions === 1) {
             if (startSentence) {
               return `Distrito de ${getDistrictList()}`;
             }
 
             return `${startStr}o distrito de ${getDistrictList()}`;
           } if (startSentence) {
             return `Distritos de ${getDistrictList()}`;
           }
 
           return `${startStr}os distritos de ${getDistrictList()}`;
         case 'azores':
           return `${startStr}${getDistrictList()} do arquipélago dos #Açores`;
         case 'madeira':
           return `${startStr}${getDistrictList()} do arquipélago da #Madeira`;
         default:
           return `${startStr}${getDistrictList()}`;
       }
     });

     const strDueType = `devido a #${strType}`;

     const strHeader = `#Aviso${level} ${strDueType}`;

     const strTwitter = `ℹ️⚠️${emoji} ${strHeader} ${getTime()} ${getDistrictStr(false)} ${emoji}⚠️ℹ️`;

     const strTelegram = `ℹ️⚠️${emoji} ${getDistrictStr(true)} ${emoji}⚠️ℹ️\n 🕰️ ${getTime()}\n${strHeader}`;

     strDiscord += `:information_source: :warning: ${emojiDiscord} ${strHeader} ${getTime()} ${getDistrictStr(false)} ${emojiDiscord} :warning: :information_source:\n\n`;

     const fileName = `warnings/Twitter_Post_Aviso${level}_${removeAccent(strType)}.png`;

     const photoURL = `${baseImagesURL}/${fileName}`;

     const splitStrTwitter = splitMessageString(strTwitter, 280).map((string) => ({
       status: string,
     }));

     splitStrTwitter[0].media = [fileName];

     if (zone === 'azores') {
       const azTweet = Object.assign([], splitStrTwitter);

       uploadThreadTwitter(azTweet, '', 'azores');
     }

     uploadThreadTwitter(splitStrTwitter, '', 'main');

     tlgMessages.push({
       chatId: telegramKeys.chat_id,
       photoURL,
       options: {
         caption: strTelegram,
       },
     });

     WarningsApi.postNewWarning(warning);

     if (level === 'Laranja' || level === 'Vermelho') {
       const post = {
         status: strTwitter,
         media: fileName,
         options: {
           spoiler_text: 'Meteorologia',
           sensitive: false,
           language: 'pt',
         },
       };

       sendPostMastodon(post, 'main');
      
       const fbpost = {
         message: strTwitter,
         media: fileName,
       }
       postMessageFacebook(fbpost);
     }
   });

   // Send messages to Discord and Telegram
    if (zone === 'mainland') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_CHANNEL_ID), `***Novos Avisos do Continente:***\n${strDiscord}`);
    } else if (zone === 'azores') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_AZ_CHANNEL_ID), `***Novos Avisos dos Açores:***\n${strDiscord}`);
    } else if (zone === 'madeira') {
      sendMessageToChannel(client.channels.get(channels.WARNINGS_MD_CHANNEL_ID), `***Novos Avisos da Madeira:***\n${strDiscord}`);
   }

   await sendMessagesTelegram(tlgMessages);
};
 
 /**
  * Fetch severe and extreme warnings from IPMA
  * Return and update DB with new warnings
  *
  * @param {Client} client
  */
 const getWarnings = async (client=undefined) => {
   const warnings = await IpmaApi.fetch();

   const newWarn = await Promise.all(warnings.map((warn) => filterWarn(warn)))
       .then((newSrchRes) => warnings.filter(((_warning, i) => newSrchRes[i])));
 
     newWarn.forEach(async (warning) => {
       await db.IpmaWarnings.create({
         ...warning,
       });
     });
 
     if (newWarn.length > 0) {
       const newWarnMainland = newWarn.filter(warning => regionsData[warning.idAreaAviso].zone === 'mainland');
       
       if (newWarnMainland.length > 0) {
        tweetNewWarnings(client, 'mainland', newWarnMainland);
       }

       const newWarnAzores = newWarn.filter(warning => regionsData[warning.idAreaAviso].zone === 'azores');
       
       if (newWarnAzores.length > 0) {
        tweetNewWarnings(client, 'azores', newWarnAzores);
       }

       const newWarnMadeira = newWarn.filter(warning => regionsData[warning.idAreaAviso].zone === 'madeira');

       if (newWarnMadeira.length > 0) {
        tweetNewWarnings(client, 'madeira', newWarnMadeira);
       }       
     }
 };
 
 /**
  * Clear old warnings from MeteoAlarm DB
  *
  */
 const clearDb = async () => {
   db.IpmaWarnings.destroy({
     where: {
       end: {
         [Op.lt]: DateTime.now({ zone: 'utc' }).toJSDate(),
       },
     },
   });
 };
 
 module.exports = {
   getWarnings,
   clearDb,
 };
