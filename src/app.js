require('dotenv').config();

const fs = require('fs');
const Discord = require('discord.js');

const Events = require('./events');

const client = new Discord.Client();
const commands = new Discord.Collection();

fs.readdirSync('./src/commands')
  .filter((file) => file.endsWith('.js'))
  .forEach((file) => {
    // eslint-disable-next-line import/no-dynamic-require
    // eslint-disable-next-line global-require
    const command = require(`./commands/${file}`);
    commands.set(command.name, command);
  });

client.commands = commands;

client.on('ready', () => Events.ready(client));
client.on('message', (message) => Events.message(client, message));

client.login(process.env.BOT_TOKEN);
