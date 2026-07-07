const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;

/**
 * Send message to Discord channel
 * Returns the API response of the last message sent
 */
const sendMessageToChannel = async (channel, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  const lastMessage = messageArray.pop();

  const files = fileUrl
    ? Array.isArray(fileUrl)
      ? fileUrl
      : [fileUrl]
    : [];

  // envia partes anteriores
  for (const msg of messageArray) {
    await channel.send({ content: msg });
  }

  // última mensagem com ficheiros (se existirem)
  return await channel.send({
    content: lastMessage,
    files,
  });
};

/**
 * Send answer to message
 */
const sendMessageAnswer = async (msgInstance, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  const firstMessage = messageArray.shift();

  const files = fileUrl
    ? Array.isArray(fileUrl)
      ? fileUrl
      : [fileUrl]
    : [];

  // reply principal (v14 format)
  await msgInstance.reply({
    content: firstMessage,
    files,
  });

  // resto vai para o canal
  for (const msgSubSet of messageArray) {
    await msgInstance.channel.send({ content: msgSubSet });
  }
};

/**
 * Send DM to the message author
 */
const sendMessageToAuthor = async (msgInstance, message) => {
  const messageArray = splitMessageString(message, discordApiLimit);

  for (const msg of messageArray) {
    await msgInstance.author.send({ content: msg });
  }
};

module.exports = {
  sendMessageToChannel,
  sendMessageAnswer,
  sendMessageToAuthor,
};