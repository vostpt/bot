require('dotenv').config();

const fs = require('fs');
const path = require('path');

const {
  Client,
  GatewayIntentBits,
  Collection,
} = require('discord.js');

const Events = require('./events');
const startHttpServer = require('./server/server');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.slashCommands = new Collection();
client.prefixCommands = new Collection();
client.triggers = new Collection();
client.cooldowns = new Collection();

const migratedCommands = new Set([
  'acronym',
  'alerts',
  'all',
  'corona',
  'debug',
  'earthquakes',
  'op',
  'rcm',
  'snsAlerts',
  'stats',
  'vost',
  'weather',
])

const slashCommandsPath = path.join(__dirname, 'slashCommands');

if (fs.existsSync(slashCommandsPath)) {
  const slashFiles = fs.readdirSync(slashCommandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of slashFiles) {
    const command = require(path.join(slashCommandsPath, file));

    if (!command?.data?.name) continue;

    client.slashCommands.set(command.data.name, command);
  }
}

const commandsPath = path.join(__dirname, 'commands');

if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath)
    .filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    if (migratedCommands.has(path.basename(file, '.js'))) {
      console.log(`⚠️ Ignoring migrated command: ${file}`);
      continue;
    }

    const command = require(path.join(commandsPath, file));

    if (!command?.name) continue;

    client.prefixCommands.set(command.name, command);
    client.cooldowns.set(command.name, new Collection());
  }
}

const triggersPath = path.join(__dirname, 'triggers');

if (fs.existsSync(triggersPath)) {
  const triggerFiles = fs.readdirSync(triggersPath)
    .filter(file => file.endsWith('.js'));

  for (const file of triggerFiles) {
    const trigger = require(path.join(triggersPath, file));

    if (!trigger?.name) continue;

    client.triggers.set(trigger.name, trigger);
  }
}

client.once('ready', () => {
  Events.ready(client);
  startHttpServer(client);

  console.log(`READY :: Bot started @ ${new Date().toLocaleString()}`);
});

client.on('messageCreate', message => {
  Events.message(client, message);
});

client.on('interactionCreate', async interaction => {

  if (interaction.isAutocomplete()) {
    const command = client.slashCommands.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (err) {
      console.error('Autocomplete error:', err);
    }

    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = client.slashCommands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (err) {
    console.error(err);

    const payload = {
      content: '❌ Erro ao executar comando.',
      ephemeral: true,
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload);
    } else {
      await interaction.reply(payload);
    }
  }
});

client.login(process.env.BOT_TOKEN);
