const moment = require('moment');
const path = require('path');
const fs = require('fs');
const { prefix } = require('../../config/bot');
const { locale } = require('../../config/locale');

moment.locale(locale);

moment.prototype.lastsLongerThan = function lastsLongerThan(amount, unit) {
  return this.add(amount, unit).isSameOrBefore(moment());
};

const OCCURENCE_DATE_FORMAT = 'DD/MM HH:mm';

const imageFolderPath = `${path.resolve('./src/images')}${path.sep}`;

/**
 * Return if an occurrence meets a certain criteria to be considered severe.
 *
 * @param {Object} messageContent
 * @returns {Boolean}
 */
const isSevere = (occurrence) => {
  const {
    d: date,
    o: operatives,
  } = occurrence;

  const event = moment(date, OCCURENCE_DATE_FORMAT);

  return (event.lastsLongerThan(1, 'hours') && operatives >= 50);
};

/**
 * Remove accents inserted in a string.
 *
 * @param {String} messageContent
 * @returns {String} strAccentsOut
 */
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

  return `Aliases: ${aliases.map((alias) => `${prefix}${alias}`).join(', ')}`;
};

const react = async (msg, reactions = []) => {
  if (reactions.length === 0) {
    msg.reply('os comandos foram enviados por DM');
  }

  try {
    await Promise.all(reactions.map((reaction) => msg.react(reaction)));
  } catch (e) {
    msg.reply('os comandos foram enviados por DM');
  }
};

/**
 * Verify if provided string is base64 encoded or not
 *
 * @param {String} str
 */
const isBase64 = (str) => {
  const base64regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;

  return base64regex.test(str);
};

/**
 * Get file content in base64 string
 *
 * @param {String} str
 * @returns {String}
 */
const getFileContent = (filedata) => {
  if (isBase64(filedata)) {
    return filedata;
  }

  return fs.readFileSync(`${imageFolderPath}${path.sep}${filedata}`, { encoding: 'base64' });
};

/**
 * Get images folder path
 *
 * @returns {String}
 */
const getImagesPath = () => imageFolderPath;

/**
* Split message to avoid passing API character limits (Discord and Twitter)
* (If returnFirst == true, return only first position of message array)
*
* @param {String} msgString
* @param {Number} charLimit
* @param {Boolean} returnFirst
*/

const splitMessageString = (msgString, charLimit = 1950, returnFirst = false) => {
  const messageArray = [];

  let lastSentCharacter = 0;

  const msgStringLength = returnFirst
    ? charLimit + 1
    : msgString.length;

  while (lastSentCharacter < msgStringLength) {
    if (msgStringLength - lastSentCharacter > charLimit) {
      const nextMessageSubset = msgString.slice(lastSentCharacter, lastSentCharacter + charLimit);

      let lastPos = nextMessageSubset.lastIndexOf('\n');

      if (lastPos < 0) {
        const lastWord = nextMessageSubset.lastIndexOf(' ');

        lastPos = lastWord < 0
          ? lastSentCharacter + charLimit
          : lastSentCharacter + lastWord;
      }

      const messageToSend = nextMessageSubset.slice(0, lastPos);

      messageArray.push(messageToSend);

      lastSentCharacter += lastPos;
    } else {
      messageArray.push(msgString.slice(lastSentCharacter, msgStringLength));
      lastSentCharacter = msgStringLength;
    }
  }

  return messageArray;
};

/**
* Parse VOST formatted date, and return a moment object
* (VOST format - DDMMMYYYY - example: 08SET2020)
* Moment's strict mode is enabled
*
* @param {String} date
* @returns {Object}
*/

const parseVostDate = async (strDate) => moment(strDate, 'DDMMMYYYY', true);

module.exports = {
  isSevere,
  printAliases,
  react,
  removeAccent,
  isBase64,
  getFileContent,
  getImagesPath,
  splitMessageString,
  parseVostDate,
};
