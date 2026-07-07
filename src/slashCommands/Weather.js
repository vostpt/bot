const { SlashCommandBuilder } = require('discord.js');
const { Weather } = require('../services');

const rowsPerMessage = 15;

module.exports = {
  data: new SlashCommandBuilder()
    .setName('weather')
    .setDescription('Mostra informação meteorológica')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Tipo de previsão')
        .setRequired(false)
        .addChoices(
          { name: 'Hoje', value: 'today' },
          { name: 'Amanhã', value: 'tomorrow' },
          { name: 'Extremos IPMA', value: 'extremes' },
        )
    ),

  async execute(interaction) {
    try {

      await interaction.deferReply();

      const type = interaction.options.getString('tipo') || 'today';

      // =========================
      // EXTREMOS
      // =========================
      if (type === 'extremes') {

        const links = await Weather.sendReportDiscord();

        return await interaction.editReply(
`📊 **Último relatório disponível dos extremos diários IPMA**

🇵🇹 Portugal Continental ${links.pt}
🏝 Madeira ${links.mad}
🌊 Açores ${links.az}`
        );
      }

      // =========================
      // WEATHER NORMAL
      // =========================
      const day = type === 'tomorrow' ? 1 : 0;

      const data = await Weather.getByDay(day);

      if (!data || data.length === 0) {
        return await interaction.editReply('❌ Sem dados meteorológicos.');
      }

      let chunk = 1;
      let events = [];

      const totalPages = Math.ceil(data.length / rowsPerMessage);

      for (let i = 0; i < data.length; i++) {

        const element = data[i];

        const msg =
`**${element.local}**
🌡 ${element.tMin}ºC - ${element.tMax}ºC
☁ ${element.descIdWeatherTypePT}
☔ ${element.precipitaProb}%
💨 ${element.vento} ${element.predWindDir}`;

        events.push(msg);

        const isLastInPage = events.length === rowsPerMessage;
        const isLastItem = i === data.length - 1;

        if (isLastInPage || isLastItem) {

          const header =
`🌤 **Meteorologia ${type === 'today' ? 'Hoje' : 'Amanhã'}**
[${chunk}/${totalPages}]`;

          if (chunk === 1) {
            await interaction.editReply(header + '\n\n' + events.join('\n\n'));
          } else {
            await interaction.followUp(header + '\n\n' + events.join('\n\n'));
          }

          events = [];
          chunk++;
        }
      }

    } catch (err) {
      console.error(err);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp('❌ Erro ao executar weather.');
      } else {
        await interaction.reply('❌ Erro ao executar weather.');
      }
    }
  }
};