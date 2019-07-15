/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');
const Events = require('./events');
const Database = require('./database');

const client = new Discord.Client();
const commands = new Discord.Collection();
const triggers = new Discord.Collection();
const cooldowns = new Discord.Collection();

// Load commands
fs.readdirSync('./src/commands')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
    cooldowns.set(command.name, new Discord.Collection());
  });

// Load triggers
fs.readdirSync('./src/triggers')
  .filter(file => file.endsWith('.js'))
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require
    const trigger = require(`./triggers/${file}`);
    triggers.set(trigger.name, trigger);
  });

client.commands = commands;
client.triggers = triggers;
client.cooldowns = cooldowns;

const dbInstance = new Database();
dbInstance.startDb();

client.on('ready', () => Events.ready(client, dbInstance));
client.on('message', message => Events.message(client, dbInstance, message));

client.login(process.env.BOT_TOKEN);
