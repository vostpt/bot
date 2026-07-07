const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const { Warnings } = require('../services');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alerts')
    .setDescription('Mostra os avisos meteorológicos do IPMA'),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const {
        acores = [],
        madeira = [],
        continente = [],
      } = await Warnings.getAll();

      const allRegions = [
        ...continente,
        ...madeira,
        ...acores,
      ];

      if (!allRegions.length) {
        return interaction.editReply(
          '✅ Não existem avisos ativos.'
        );
      }

      const embed = new EmbedBuilder()
        .setTitle('⚠️ Avisos Meteorológicos')
        .setTimestamp();

      for (const region of allRegions) {
        const alerts = region.alertas || [];

        if (!alerts.length) continue;

        const value = alerts
          .map(alert => {
            const weatherType =
              alert.tipo === 'Precipitação'
                ? '🌧️ Chuva'
                : alert.tipo;

            return (
              `**${alert.nivel}** · ${weatherType}\n` +
              `${alert.inicio} → ${alert.fim}`
            );
          })
          .join('\n\n');

        embed.addFields({
          name: region.local,
          value: value.slice(0, 1024),
        });
      }

      await interaction.editReply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(error);

      await interaction.editReply(
        '❌ Não foi possível obter os avisos do IPMA.'
      );
    }
  },
};