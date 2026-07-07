const moment = require('moment');
const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const { Earthquakes } = require('../services');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sismos')
    .setDescription('Consulta os sismos registados numa determinada data')
    .addStringOption(option =>
      option
        .setName('data')
        .setDescription('Formato: DD/MM/AAAA')
        .setRequired(true)
    ),

  async execute(interaction) {
    const requestedDate = interaction.options.getString('data');

    if (!moment(requestedDate, 'DD/MM/YYYY', true).isValid()) {
      return interaction.reply({
        content:
          '❌ Data inválida. Utilize o formato **DD/MM/AAAA**.\nExemplo: `07/06/2026`',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    try {
      const earthquakes = await Earthquakes.getByDate(requestedDate);

      if (!earthquakes?.length) {
        return interaction.editReply(
          `📭 Não existem dados de sismos para **${requestedDate}**.`
        );
      }

      const sensed = [];
      const notSensed = [];

      earthquakes
        .sort((a, b) => new Date(a.time) - new Date(b.time))
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
            .setTitle(`🌍 Sismos sentidos - ${requestedDate}`)
            .setDescription(limitText(sensed.join('\n')))
            .setTimestamp()
        );
      }

      if (notSensed.length) {
        embeds.push(
          new EmbedBuilder()
            .setTitle(`📊 Restantes sismos - ${requestedDate}`)
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