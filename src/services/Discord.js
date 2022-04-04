const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;

/**
* Send message to Discord channel
* Returns the API response of the last message sent
*
* @param {Object} channel
* @param {String} message
* @param {String} fileUrl
*/
const sendMessageToChannel = async (channel, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  const lastMessage = messageArray.pop();

  const fileArray = [];

  if (fileUrl) {
    fileArray.push(fileUrl);    
  }

  messageArray.forEach((msgSubSet) => { channel.send(msgSubSet); });

  return await channel.send(lastMessage, { files: fileArray });
};

/**
* Send answer to message
*
* @param {Object} msgInstance
* @param {String} message
*/
const sendMessageAnswer = async (msgInstance, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  const firstMessage = messageArray.shift();

  if (fileUrl) {
    const fileArray = Array.isArray(fileUrl)
      ? { files: fileUrl }
      : { files: [fileUrl] };

    const answer = msgInstance.reply(firstMessage, fileArray);

    return answer;
  } else {
    msgInstance.reply(firstMessage);
  }  

  messageArray.forEach((msgSubSet) => { msgInstance.channel.send(msgSubSet); });

};

/**
* Send DM to the message author
*
* @param {Object} msgInstance
* @param {String} message
*/
const sendMessageToAuthor = async (msgInstance, message) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  messageArray.forEach((msgSubSet) => { msgInstance.author.send(msgSubSet); });
};

module.exports = {
  sendMessageToChannel,
  sendMessageAnswer,
  sendMessageToAuthor,
};
