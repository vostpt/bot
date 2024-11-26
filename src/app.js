/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const { Collection, Client, Events, GatewayIntentBits } = require('discord.js');
const { command_prefix } = require('./config/bot.js');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] });


//Load triggers
const triggers = new Collection();
fs.readdirSync('./src/triggers')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    const trigger = require(`./triggers/${file}`);
    triggers.set(trigger.name, trigger);
  });
client.triggers = triggers;

//Load commands
const commands = new Collection();
fs.readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
  });
client.commands = commands;

// Starting bot
client.once(Events.ClientReady, readyClient => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
  if (message.author.bot) return;
  console.log("Received message: ", message.content.toString());

  let msg = message.content.toString();
  // COMMANDS
  if (msg.startsWith(command_prefix)) {
    commands.forEach(async (command) => {
      if (message.content.startsWith(command_prefix)) {
        if (message.content.startsWith(command_prefix + command.name.toLowerCase())) {
          const args = message.content.split(' ');
          args.shift();
          try {
            await command.execute(message, args);
          } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
          }
        } else if ( Array.isArray(command.usage) &&
          command.usage.filter(word => message.content.toLowerCase().includes(word))) {
          try {
            await command.execute(message);
          } catch (error) {
            console.error(`Error executing command ${command.name}:`, error);
          }
        }
      }
    });
  }

  //TRIGGERS
  triggers.forEach(async (trigger) => {
    if (trigger.limitToChannels && 
      trigger.limitToChannels.includes(message.channel.id) ||
      trigger.words && trigger.words.some(word => message.content.toLowerCase().includes(word))) {
      try {
        await trigger.execute(message);
      } catch (error) {
        console.error(`Error executing trigger ${trigger.name}:`, error);
      }
    }
  });

});

client.login(process.env.BOT_TOKEN);
