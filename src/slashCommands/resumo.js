const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { Warnings, Prociv, Fires, Earthquakes } = require('../services');

const getResultOrMessage = (result, format) => (
  result.status === 'fulfilled'
    ? format(result.value)
    : '⚠️ Fonte temporariamente indisponível.'
);

module.exports = {
  data: new SlashCommandBuilder()
    .setName('resumo')
    .setDescription('Resumo informativo de avisos, ocorrências, incêndios e sismos'),

  async execute(interaction) {
    await interaction.deferReply();

    const results = await Promise.allSettled([
      Warnings.getAll(),
      Prociv.getAll(),
      Fires.getImportantForestFires(),
      Earthquakes.getAll(),
    ]);

    const [warningsResult, occurrencesResult, importantFiresResult, earthquakesResult] = results;
    const warningText = getResultOrMessage(warningsResult, (regionsByZone) => {
      const regions = [
        ...(regionsByZone.continente || []),
        ...(regionsByZone.madeira || []),
        ...(regionsByZone.acores || []),
      ];
      const warnings = regions.flatMap((region) => region.alertas || []);
      if (!warnings.length) return '✅ Sem avisos meteorológicos ativos.';

      const severityCounts = warnings.reduce((counts, warning) => {
        const severity = (warning.nivel || 'Outro').toLocaleLowerCase('pt-PT');
        counts[severity] = (counts[severity] || 0) + 1;
        return counts;
      }, {});

      const summary = Object.entries(severityCounts)
        .map(([severity, count]) => `${severity}: ${count}`)
        .join(' · ');
      return `⚠️ ${warnings.length} aviso(s) ativo(s)\n${summary}`;
    });

    const occurrencesText = getResultOrMessage(
      occurrencesResult,
      (occurrences) => `🚒 ${occurrences.length} ocorrência(s) ProCiv na consulta atual.`,
    );
    const importantFiresText = getResultOrMessage(
      importantFiresResult,
      (fires) => `🔥 ${fires.length} incêndio(s) marcado(s) como importante(s).`,
    );
    const earthquakesText = getResultOrMessage(earthquakesResult, (earthquakes) => {
      const since = Date.now() - (24 * 60 * 60 * 1000);
      const recent = earthquakes
        .filter((earthquake) => new Date(earthquake.time).getTime() >= since)
        .sort((a, b) => new Date(b.time) - new Date(a.time));
      const latest = recent.slice(0, 3).map((earthquake) => (
        `M${earthquake.magType} ${earthquake.magnitud} · ${earthquake.obsRegion}`
      ));

      return recent.length
        ? `🌍 ${recent.length} sismo(s) nas últimas 24 horas${latest.length ? `\n${latest.join('\n')}` : ''}`
        : '✅ Sem sismos registados nas últimas 24 horas.';
    });

    const generatedAt = new Date().toLocaleString('pt-PT', { timeZone: 'Europe/Lisbon' });
    const embed = new EmbedBuilder()
      .setColor(0x1e1f22)
      .setTitle('📋 Resumo operacional')
      .setDescription(`Consulta agregada às ${generatedAt}.\nInformação de consulta; não é um canal de despacho ou socorro.`)
      .addFields(
        { name: 'Avisos IPMA', value: warningText },
        { name: 'Ocorrências ProCiv', value: occurrencesText },
        { name: 'Incêndios importantes', value: importantFiresText },
        { name: 'Sismos', value: earthquakesText },
      );

    await interaction.editReply({ embeds: [embed] });
  },
};
