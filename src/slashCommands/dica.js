const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

const tips = [
  {
    text: 'Prepare um plano familiar de emergência e combine como contactar e reunir a família.',
    source: 'https://prociv.gov.pt/media/ovjbpe1c/sismos-prepare-se-e-proteja-se.pdf',
  },
  {
    text: 'Prepare um kit de emergência com antecedência e adapte-o às necessidades de quem vive consigo.',
    source: 'https://prociv.gov.pt/media/ovjbpe1c/sismos-prepare-se-e-proteja-se.pdf',
  },
  {
    text: 'Reveja regularmente o kit de emergência e substitua os artigos fora de prazo.',
    source: 'https://prociv.gov.pt/media/ovjbpe1c/sismos-prepare-se-e-proteja-se.pdf',
  },
  {
    text: 'Durante um sismo, siga as orientações oficiais: baixar, proteger e aguardar.',
    source: 'https://prociv.gov.pt/media/ovjbpe1c/sismos-prepare-se-e-proteja-se.pdf',
  },
  {
    text: 'Consulte os avisos oficiais e ajuste os seus planos à evolução da situação.',
    source: 'https://prociv.gov.pt/pt/avisos-a-populacao/',
  },
  {
    text: 'Em dias de perigo de incêndio rural muito elevado ou máximo, cumpra as restrições oficiais ao uso do fogo.',
    source: 'https://prociv.gov.pt/pt/noticias/19062026-perigo-de-incendio-rural-medidas-preventivas/',
  },
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('dica')
    .setDescription('Recebe uma dica de preparação e autoproteção'),

  async execute(interaction) {
    const index = Math.floor(Math.random() * tips.length);
    const tip = tips[index];
    const embed = new EmbedBuilder()
      .setColor(0x1e1f22)
      .setTitle('🧭 Dica de preparação')
      .setDescription(tip.text)
      .addFields({ name: 'Fonte oficial', value: `[ANEPC](${tip.source})` });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
