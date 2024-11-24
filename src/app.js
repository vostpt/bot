/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const { Client, Events, GatewayIntentBits } = require('discord.js');

const client = new Client({ intents: [
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent,
  GatewayIntentBits.GuildMembers,
] });

// const commands = new Discord.Collection();
// const triggers = new Discord.Collection();
// const cooldowns = new Discord.Collection();

// Load commands
// fs.readdirSync('./src/commands')
//   .filter(file => file.endsWith('.js'))
//   .forEach((file) => {
//     const command = require(`./commands/${file}`);
//     commands.set(command.name, command);
//     cooldowns.set(command.name, new Discord.Collection());
//   });

// Load triggers
// fs.readdirSync('./src/triggers')
//   .filter(file => file.endsWith('.js'))
//   .forEach((file) => {
//     const trigger = require(`./triggers/${file}`);
//     triggers.set(trigger.name, trigger);
//   });
//
// client.commands = commands;
// client.triggers = triggers;
// client.cooldowns = cooldowns;
//
// client.on('ready', () => Events.ready(client));
// client.on('message', message => Events.message(client, message));
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.login(process.env.BOT_TOKEN);
