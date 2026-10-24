require('dotenv').config();
const { REST, Routes } = require('discord.js');

const rest = new REST({ version: '10' }).setToken(process.env.BOT_TOKEN);

if (!process.env.BOT_TOKEN || !process.env.CLIENT_ID || !process.env.GUILD_ID) {
  throw new Error('BOT_TOKEN, CLIENT_ID and GUILD_ID are required to clear slash commands');
}

(async () => {
  try {
    console.log('A apagar GLOBAL commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: [] }
    );

    console.log('A apagar GUILD commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: [] }
    );

    console.log('Tudo limpo!');
  } catch (err) {
    console.error(err);
  }
})();
