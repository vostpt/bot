
/**
* Split message to avoid passing Discord API character limit
* (2000 characters)
*
* @param {String} msgString
*/

const splitMessageString = (msgString) => {
  const messageArray = [];

  let lastSentCharacter = 0;
  const msgStringLength = msgString.length;

  while (lastSentCharacter < msgStringLength) {
    if (msgStringLength - lastSentCharacter > 2000) {
      const nextMessageSubset = msgString.substr(lastSentCharacter, lastSentCharacter + 2000);

      const lastNewLinePos = nextMessageSubset.lastIndexOf('\n');

      const finalStrSubsetPos = lastNewLinePos < 0
        ? lastSentCharacter + 2000
        : lastNewLinePos;

      const messageToSend = nextMessageSubset.substr(0, finalStrSubsetPos);

      messageArray.push(messageToSend);

      lastSentCharacter = finalStrSubsetPos;
    } else {
      messageArray.push(msgString.substr(lastSentCharacter, msgStringLength));
      lastSentCharacter = msgStringLength;
    }
  }

  return messageArray;
};

/**
* Send message to Discord channel
*
* @param {Object} channel
* @param {String} message
*/
const sendMessageToChannel = (channel, message) => {
  const messageArray = splitMessageString(message);

  messageArray.forEach((msgSubSet) => { channel.send(msgSubSet); });
};

/**
* Send answer to message
*
* @param {Object} msgInstance
* @param {String} message
*/
const sendMessageAnswer = (msgInstance, message) => {
  const messageArray = splitMessageString(message);

  messageArray.forEach((msgSubSet) => { msgInstance.reply(msgSubSet); });
};

module.exports = {
  sendMessageToChannel,
  sendMessageAnswer,
};
