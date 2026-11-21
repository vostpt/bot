const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('reportar')
    .setDescription('Mostra os contactos oficiais para comunicar uma emergência'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor(0xc0392b)
      .setTitle('☎️ Comunicar uma emergência')
      .setDescription([
        '**Perigo imediato, feridos ou necessidade urgente de socorro:** liga **112**.',
        '**Alerta de incêndio rural:** liga **117**.',
        '',
        'Este bot não encaminha relatos para os serviços de emergência. Ao ligar, indica a localização exata e o que está a acontecer.',
        '',
        '[Contactos de emergência · gov.pt](https://www.gov.pt/guias/contactos-de-emergencia-em-portugal)',
      ].join('\n'));

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
