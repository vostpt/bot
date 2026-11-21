const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const { Warnings } = require('../services');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('alerts')
    .setDescription('Mostra avisos meteorológicos IPMA, opcionalmente filtrados por localidade')
    .addStringOption(option => option
      .setName('local')
      .setDescription('Filtra pelo nome do distrito ou região')
      .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    try {
      const {
        acores = [],
        madeira = [],
        continente = [],
      } = await Warnings.getAll();

      const requestedLocal = interaction.options.getString('local') || '';
      const normalize = (value) => String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('pt-PT');

      const allRegions = [
        ...continente,
        ...madeira,
        ...acores,
      ].filter((region) => !requestedLocal
        || normalize(region.local || '').includes(normalize(requestedLocal)));

      const regionsWithAlerts = allRegions
        .map((region) => ({ ...region, alertas: region.alertas || [] }))
        .filter((region) => region.alertas.length > 0);

      if (!regionsWithAlerts.length) {
        return interaction.editReply(
          requestedLocal
            ? `✅ Não existem avisos ativos para **${requestedLocal}**.`
            : '✅ Não existem avisos ativos.'
        );
      }

      const embed = new EmbedBuilder()
        .setTitle(requestedLocal
          ? `⚠️ Avisos Meteorológicos · ${requestedLocal}`
          : '⚠️ Avisos Meteorológicos')
        .setTimestamp();

      for (const region of regionsWithAlerts.slice(0, 25)) {
        const alerts = region.alertas;
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
