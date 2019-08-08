const moment = require('moment');
const { prefix } = require('../../config/bot');

moment.prototype.lastsLongerThan = function lastsLongerThan(amount, unit) {
  return this.add(amount, unit).isSameOrBefore(moment());
};

const OCCURENCE_DATE_FORMAT = 'DD/MM HH:mm';

const isSevere = (occurrence) => {
  const {
    d: date,
    o: operatives,
  } = occurrence;

  const event = moment(date, OCCURENCE_DATE_FORMAT);

  return (event.lastsLongerThan(1, 'hours') && operatives >= 50);
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

/**
 * Print aliases message. Main use in commands.
 *
 * @param {Array<String>} aliases
 */
const printAliases = (aliases = []) => {
  if (aliases.length === 0) {
    return '';
  }

  return `Aliases: ${aliases.map(alias => `${prefix}${alias}`).join(', ')}`;
};

const react = async (msg, reactions = []) => {
  if (reactions.length === 0) {
    msg.reply('os comandos foram enviados por DM');
  }

  try {
    await reactions.forEach(reaction => msg.react(reaction));
  } catch (e) {
    msg.reply('os comandos foram enviados por DM');
  }
};

module.exports = {
  isSevere,
  printAliases,
  react,
  removeAccent,
};
