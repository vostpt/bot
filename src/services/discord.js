const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;


/**
* Send message to Discord channel
* Returns the API response of the last message sent
*
* @param {Object} channelInstance
* @param {String} message
* @param {String} fileUrl
*/
const sendMessageToChannel = async (channelInstance, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);
  const lastMessage = messageArray.pop();
  const fileArray = [];
  if (fileUrl) {
    Array.isArray(fileUrl) ? { files: fileArray } : { files: [fileUrl]}
  }
  messageArray.forEach((msgSubSet) => { channelInstance.send(msgSubSet); });
  return await channelInstance.send(lastMessage, { files: fileArray });
};

/**
 * Send message to Discord channel
 * Returns the API response of the last message sent
 *
 * @param {Object} msgInstance
 * @param {String} answer
 */
const sendMessageAnswer = async (msgInstance, answer, fileUrl) => {
  const messageArray = splitMessageString(answer, discordApiLimit);
  const firstMessage = messageArray.shift();
  const fileArray = [];
  if (fileUrl) {
    Array.isArray(fileUrl) ? { files: fileArray } : { files: [fileUrl]}

    const answer = msgInstance.reply(firstMessage, fileArray );
    return answer;
  } else {
    answer = await msgInstance.reply(firstMessage);
  }
  
  for (const msgSubSet of messageArray) {
    await msgInstance.channel.send(msgSubSet);
  }

  return answer;
};

/**
 * Send message to Discord author
 * Returns the API response of the last message sent
 *
 * @param {Object} message
 * @param {String} answer
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

