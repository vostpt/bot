/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');
const Events = require('./events');

const client = new Discord.Client();
const commands = new Discord.Collection();
const triggers = new Discord.Collection();
const cooldowns = new Discord.Collection();

// Load commands
fs.readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
    cooldowns.set(command.name, new Discord.Collection());
  });

// Load triggers
fs.readdirSync('./src/triggers')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    const trigger = require(`./triggers/${file}`);
    triggers.set(trigger.name, trigger);
  });

client.commands = commands;
client.triggers = triggers;
client.cooldowns = cooldowns;

client.on('ready', () => Events.ready(client));
client.on('message', message => Events.message(client, message));

client.login(process.env.BOT_TOKEN);
