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

const splitMessageString = (message, charLimit = 1950, returnFirst = false) => {
  const messageArray = [];
  let lastSentCharacter = 0;

  const msgStringLength = returnFirst
    ? charLimit + 1
    : msgString.length;

  while (lastSentCharacter < msgStringLength) {
    if (msgStringLength - lastSentCharacter > charLimit) {
      const nextMessageSubset = message.slice(lastSentCharacter, lastSentCharacter + charLimit);
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
      messageArray.push(message.slice(lastSentCharacter, msgStringLength));
      lastSentCharacter = msgStringLength;
    }
  }
  return messageArray;
}

module.exports = {
  removeAccent,
  splitMessageString,
};
