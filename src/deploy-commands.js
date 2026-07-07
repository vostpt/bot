require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');

const commands = [];

const commandsPath = path.join(__dirname, 'slashCommands');
const commandFiles = fs.readdirSync(commandsPath)
  .filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);

  try {
    if (!command?.data) {
      console.warn(`❌ ${file}: sem data`);
      continue;
    }

    const json = command.data.toJSON();

    commands.push(json);

  } catch (err) {
    console.error(`❌ ERRO no ficheiro: ${file}`);
    console.error(err);
  }
}

const rest = new REST({ version: '10' })
  .setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log('Deploying slash commands...');

    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands },
    );

    console.log('Slash commands deployed!');
  } catch (error) {
    console.error('❌ Deploy error:', error);
  }
})();