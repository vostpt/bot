/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const { Collection, Client, Events, GatewayIntentBits } = require('discord.js');
const greetingsModule = require('./triggers/greetings.js');
const command_prefix = require('./config/bot.js');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] });

const triggers = new Collection();

//Load triggers
fs.readdirSync('./src/triggers')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    const trigger = require(`./triggers/${file}`);
    triggers.set(trigger.name, trigger);
  });
client.triggers = triggers;

const commands = new Collection();
//Load commands
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

  if (message.content.startsWith(" " + command_prefix)) {
    console.log("Received command: ", message.content.toString());
    commands.forEach(async (command) => {
      if (message.content.startsWith(command_prefix))
        console.log("Received command: ", message.content.toString());
      if (message.content.startsWith(command_prefix + command.name)) {
        console.log("Received command: ", command.name);
        const args = message.content.split(' ');
        args.shift();
        try {
          await command.execute(message, args);
        } catch (error) {
          console.error(`Error executing command ${command.name}:`, error);
        }
      }
    });
  }
  triggers.forEach(async (trigger) => {
    // Check if channel is allowed for this trigger
    if (trigger.limitToChannels && 
      trigger.limitToChannels.includes(message.channel.id)) {
      try {
        await trigger.execute(message);
      } catch (error) {
        console.error(`Error executing trigger ${trigger.name}:`, error);
      }
    }
  });

});
client.login(process.env.BOT_TOKEN);
