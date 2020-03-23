const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;

/**
* Send message to Discord channel
*
* @param {Object} channel
* @param {String} message
* @param {String} fileUrl
*/
const sendMessageToChannel = (channel, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  messageArray.forEach((msgSubSet) => { channel.send(msgSubSet); });

  if (fileUrl) {
    channel.send({ files: [fileUrl] });
  }
};

/**
* Send answer to message
*
* @param {Object} msgInstance
* @param {String} message
*/
const sendMessageAnswer = (msgInstance, message) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  const firstMessage = messageArray.shift();

  msgInstance.reply(firstMessage);

  messageArray.forEach((msgSubSet) => { msgInstance.channel.send(msgSubSet); });
};

module.exports = {
  sendMessageToChannel,
  sendMessageAnswer,
};
