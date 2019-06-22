const moment = require('moment');

const OCCURENCE_DATE_FORMAT = 'DD/MM HH:mm';

const isSevere = (occurrence) => {
  const {
    d: date,
    o: mans,
  } = occurrence;

  const formattedBegin = moment(date, OCCURENCE_DATE_FORMAT).subtract(1, 'hours');

  if ((formattedBegin.add(1, 'hours')).isSameOrBefore(moment()) && mans >= 50) {
    return true;
  }
  return false;
};

const removeAccent = (messageContent) => {
  const strAccents = messageContent.split('');

  let strAccentsOut = [];
  const strAccentsLen = strAccents.length;

  const accents = 'ÀÁÂÃÄÅàáâãäåÒÓÔÕÕÖØòóôõöøÈÉÊËèéêëðÇçÐÌÍÎÏìíîïÙÚÛÜùúûüÑñŠšŸÿýŽž';
  const accentsOut = 'AAAAAAaaaaaaOOOOOOOooooooEEEEeeeeeCcDIIIIiiiiUUUUuuuuNnSsYyyZz';

  for (let y = 0; y < strAccentsLen; y += 1) {
    if (accents.indexOf(strAccents[y]) !== -1) {
      strAccentsOut[y] = accentsOut.substr(accents.indexOf(strAccents[y]), 1);
    } else {
      strAccentsOut[y] = strAccents[y];
    }
  }

  strAccentsOut = strAccentsOut.join('');

  return strAccentsOut;
};

module.exports = {
  isSevere,
  removeAccent,

};
