// src/services/discord.js

require('dotenv').config();
const fs = require('fs');
const { Collection, Client, Events, GatewayIntentBits } = require('discord.js');
const { command_prefix } = require('../config/bot.js');
const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;

const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ] 
});

const handleCommand = async (commands, message) => {
  const command = commands.find(cmd => 
    message.content.startsWith(command_prefix + cmd.name.toLowerCase()) || 
    (Array.isArray(cmd.usage) && cmd.usage.some(word => 
      message.content.toLowerCase().includes(word)))
  );

  if (command) {
    try {
      if (message.content.startsWith(command_prefix + command.name.toLowerCase())) {
        const args = message.content.split(' ');
        // if (args == null || args.length == 0) { 
        if (args.splice(1).length == 0) {
          await command.execute(message, client);
        } else {

        args.shift();
        await command.execute(message, args);
        }
      }
    } catch (error) {
      console.error(`Error executing command ${command.name}:`, error);
    }
  }
};

const handleTriggers = async (triggers, message) => {
  for (const trigger of triggers.values()) {
    if (trigger.limitToChannels && 
      trigger.limitToChannels.includes(message.channel.id) ||
      trigger.words && trigger.words.some(word => 
        message.content.toLowerCase().includes(word))) {
      try {
        if (trigger.execute.length === 2) {
          await trigger.execute(message, client);
        } else {
          await trigger.execute(message);
        }
      } catch (error) {
        console.error(`Error executing trigger ${trigger.name}:`, error);
      }
    }
  }
};

const startDiscordClient = async () => {
  // Load triggers
  const triggers = new Collection();
  fs.readdirSync('./src/triggers')
    .filter(file => file.endsWith('.js'))
    .forEach((file) => {
      const trigger = require(`../triggers/${file}`);
      triggers.set(trigger.name, trigger);
    });
  client.triggers = triggers;

  // Load commands
  const commands = new Collection();
  fs.readdirSync('./src/commands')
    .filter(file => file.endsWith('.js'))
    .forEach((file) => {
      const command = require(`../commands/${file}`);
      commands.set(command.name, command);
    });
  client.commands = commands;

  // Starting bot
  client.once(Events.ClientReady, readyClient => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
  });

  // Message handling
  client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    console.log("Received message: ", message.content.toString());

    // Handle commands if message starts with prefix
    if (message.content.startsWith(command_prefix)) {
      await handleCommand(commands, message);
    }

    // Handle triggers
    await handleTriggers(triggers, message);
  });

  await client.login(process.env.BOT_TOKEN);
  return client;
};

// Message sending utilities
const sendMessageToChannel = async (channelInstance, message, fileUrl) => {
  const messageArray = splitMessageString(message, discordApiLimit);
  const lastMessage = messageArray.pop();
  var fileArray = [];
  if (fileUrl) {
    fileArray = Array.isArray(fileUrl) ? fileUrl : [fileUrl];
  }

  for (const msgSubSet of messageArray) {
    await channelInstance.send(msgSubSet);
  }
  return await channelInstance.send(lastMessage, { files: fileArray });
};

const sendMessageAnswer = async (msgInstance, answer, fileUrl) => {
  const messageArray = splitMessageString(answer, discordApiLimit);
  const firstMessage = messageArray.shift();
  const fileArray = fileUrl ? (Array.isArray(fileUrl) ? fileUrl : [fileUrl]) : [];

  const response = await msgInstance.reply(firstMessage, { files: fileArray });

  for (const msgSubSet of messageArray) {
    await msgInstance.channel.send(msgSubSet);
  }

  return response;
};

const sendMessageToAuthor = async (msgInstance, message) => {
  const messageArray = splitMessageString(message, discordApiLimit);
  for (const msgSubSet of messageArray) {
    await msgInstance.author.send(msgSubSet);
  }
};

module.exports = {
  startDiscordClient,
  sendMessageToChannel,
  sendMessageAnswer,
  sendMessageToAuthor,
};
