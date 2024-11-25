/* eslint-disable global-require */
require('dotenv').config();

const fs = require('fs');
const { Collection, Client, Events, GatewayIntentBits } = require('discord.js');
const greetingsModule = require('./triggers/greetings.js');

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
client.once(Events.ClientReady, readyClient => {
	console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    
    // Check if message is in allowed channels
    if (greetingsModule.limitToChannels.includes(message.channel.id)) {
        await greetingsModule.execute(message);
    }
});

client.login(process.env.BOT_TOKEN);
