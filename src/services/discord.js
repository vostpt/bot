require('dotenv').config();
const config = require('../config');
const fs = require('fs');
const { Collection, Client, Events, GatewayIntentBits } = require('discord.js');
const { command_prefix } = require('../config/bot.js');
const { splitMessageString } = require('../helpers');

const discordApiLimit = 1950;

// Create Discord client only if enabled
const createDiscordClient = () => {
  if (!config.discord.enabled) {
    console.log('Discord service is disabled in configuration');
    return null;
  }

  return new Client({ 
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
      GatewayIntentBits.GuildMembers,
    ] 
  });
};

const client = createDiscordClient();

/**
 * Handle Discord commands
 * @param {Collection} commands - Collection of available commands
 * @param {Message} message - Discord message object
 */
const handleCommand = async (commands, message) => {
  if (!client) return;

  const command = commands.find(cmd => 
    message.content.startsWith(command_prefix + cmd.name.toLowerCase()) || 
    (Array.isArray(cmd.usage) && cmd.usage.some(word => 
      message.content.toLowerCase().includes(word)))
  );

  if (command) {
    try {
      if (message.content.startsWith(command_prefix + command.name.toLowerCase())) {
        const args = message.content.split(' ');
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

/**
 * Handle Discord triggers
 * @param {Collection} triggers - Collection of available triggers
 * @param {Message} message - Discord message object
 */
const handleTriggers = async (triggers, message) => {
  if (!client) return;

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

/**
 * Initialize and start the Discord client
 * @returns {Client|null} Discord client instance or null if disabled
 */
const startDiscordClient = async () => {
  if (!client) {
    return null;
  }

  try {
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

    try {
      await client.login(process.env.BOT_TOKEN);
      return client;
    } catch (loginError) {
      console.error('Failed to login to Discord:', loginError);
      return null;
    }
  } catch (error) {
    console.error('Failed to initialize Discord client:', error);
    return null;
  }
};

/**
 * Send a message to a specific Discord channel
 * @param {TextChannel} channelInstance - Discord channel instance
 * @param {String} message - Message to send
 * @param {String|Array} fileUrl - Optional file(s) to attach
 * @returns {Promise<Message|null>} Sent message or null if disabled
 */
const sendMessageToChannel = async (channelInstance, message, fileUrl) => {
  if (!client) return null;

  try {
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
  } catch (error) {
    console.error('Error sending message to channel:', error);
    return null;
  }
};

/**
 * Send a reply to a message
 * @param {Message} msgInstance - Discord message instance to reply to
 * @param {String} answer - Reply content
 * @param {String|Array} fileUrl - Optional file(s) to attach
 * @returns {Promise<Message|null>} Sent message or null if disabled
 */
const sendMessageAnswer = async (msgInstance, answer, fileUrl) => {
  if (!client) return null;

  try {
    const messageArray = splitMessageString(answer, discordApiLimit);
    const firstMessage = messageArray.shift();
    const fileArray = fileUrl ? (Array.isArray(fileUrl) ? fileUrl : [fileUrl]) : [];

    const response = await msgInstance.reply(firstMessage, { files: fileArray });

    for (const msgSubSet of messageArray) {
      await msgInstance.channel.send(msgSubSet);
    }

    return response;
  } catch (error) {
    console.error('Error sending message answer:', error);
    return null;
  }
};

/**
 * Send a direct message to a user
 * @param {Message} msgInstance - Discord message instance
 * @param {String} message - Message to send
 * @returns {Promise<void>}
 */
const sendMessageToAuthor = async (msgInstance, message) => {
  if (!client) return null;

  try {
    const messageArray = splitMessageString(message, discordApiLimit);
    for (const msgSubSet of messageArray) {
      await msgInstance.author.send(msgSubSet);
    }
  } catch (error) {
    console.error('Error sending message to author:', error);
  }
};

/**
 * Get the Discord client instance
 * @returns {Client|null} Discord client or null if disabled
 */
const getClient = () => client;

module.exports = {
  startDiscordClient,
  sendMessageToChannel,
  sendMessageAnswer,
  sendMessageToAuthor,
  getClient,
  isEnabled: () => Boolean(client)
};
