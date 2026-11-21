const moment = require('moment');
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const { Earthquakes } = require('../services');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sismos')
    .setDescription('Consulta os sismos registados')
    .addSubcommand((subcommand) => subcommand
      .setName('data')
      .setDescription('Consulta sismos numa data específica')
      .addStringOption((option) => option
        .setName('data')
        .setDescription('Formato: DD/MM/AAAA')
        .setRequired(true)))
    .addSubcommand((subcommand) => subcommand
      .setName('recentes')
      .setDescription('Mostra os sismos mais recentes')
      .addIntegerOption((option) => option
        .setName('horas')
        .setDescription('Período a consultar (por omissão: 24 horas)')
        .setMinValue(1)
        .setMaxValue(168)
        .setRequired(false))),

  async execute(interaction) {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'data') {
      const requestedDate = interaction.options.getString('data');
      if (!moment(requestedDate, 'DD/MM/YYYY', true).isValid()) {
        return interaction.reply({
          content:
            '❌ Data inválida. Utilize o formato **DD/MM/AAAA**.\nExemplo: `07/06/2026`',
          ephemeral: true,
        });
      }
    }

    await interaction.deferReply();

    try {
      let earthquakes;
      let responseTitle;

      if (subcommand === 'recentes') {
        const hours = interaction.options.getInteger('horas') || 24;
        const threshold = Date.now() - (hours * 60 * 60 * 1000);
        earthquakes = (await Earthquakes.getAll())
          .filter((earthquake) => new Date(earthquake.time).getTime() >= threshold)
          .sort((a, b) => new Date(b.time) - new Date(a.time))
          .slice(0, 10);
        responseTitle = `últimas ${hours} hora(s)`;
      } else {
        const requestedDate = interaction.options.getString('data');
        earthquakes = await Earthquakes.getByDate(requestedDate);
        responseTitle = requestedDate;
      }

      if (!earthquakes?.length) {
        return interaction.editReply(subcommand === 'recentes'
          ? '📭 Não há sismos recentes no período selecionado.'
          : `📭 Não existem dados de sismos para **${responseTitle}**.`);
      }

      const sensed = [];
      const notSensed = [];

      earthquakes
        .sort((a, b) => subcommand === 'recentes'
          ? new Date(b.time) - new Date(a.time)
          : new Date(a.time) - new Date(b.time))
        .forEach(eq => {
          const text = formatEarthquake(eq);

          if (eq.sensed) {
            sensed.push(text);
          } else {
            notSensed.push(text);
          }
        });

      const embeds = [];

      if (sensed.length) {
        embeds.push(
          new EmbedBuilder()
            .setTitle(`🌍 Sismos sentidos - ${responseTitle}`)
            .setDescription(limitText(sensed.join('\n')))
            .setTimestamp()
        );
      }

      if (notSensed.length) {
        embeds.push(
          new EmbedBuilder()
            .setTitle(`📊 Restantes sismos - ${responseTitle}`)
            .setDescription(limitText(notSensed.join('\n')))
            .setTimestamp()
        );
      }

      await interaction.editReply({
        embeds: [embeds[0]],
      });

      for (let i = 1; i < embeds.length; i++) {
        await interaction.followUp({
          embeds: [embeds[i]],
        });
      }

    } catch (error) {
      console.error(error);

      await interaction.editReply(
        '❌ Ocorreu um erro ao consultar os dados dos sismos.'
      );
    }
  },
};

function formatEarthquake(eq) {
  const time = moment(eq.time).format('HH:mm');

  let text =
    `🕒 ${time} | ` +
    `M${eq.magType} **${eq.magnitud}** | ` +
    `${eq.obsRegion} | ` +
    `${eq.depth} km`;

  if (eq.sensed) {
    text +=
      `\n↳ Sentido em **${eq.local}** ` +
      `(Intensidade ${eq.degree})`;
  }

  text += `\n📍 ${eq.lat}, ${eq.lon}`;

  if (eq.shakemapref) {
    text += `\n🔗 ${eq.shakemapref}`;
  }

  return text;
}

function limitText(text, max = 4000) {
  if (text.length <= max) return text;

  return text.substring(0, max - 50) +
    '\n\n⚠️ Existem mais resultados que não puderam ser apresentados.';
}
