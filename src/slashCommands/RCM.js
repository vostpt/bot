const { SlashCommandBuilder } = require('discord.js');
const rcm = require('../api/Rcm');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('rcm')
    .setDescription('Risco de incêndio em Portugal')
    .addStringOption(option =>
      option.setName('dia')
        .setDescription('hoje')
        .setRequired(true)
    ),

  async execute(interaction) {
    const dia = interaction.options.getString('dia');

    if (dia !== 'hoje') {
      return interaction.reply({
        content: 'Só está disponível: /rcm hoje',
        ephemeral: true,
      });
    }

    await interaction.deferReply();

    const result = await rcm.fetch();

    if (!result) {
      return interaction.editReply('❌ Não foi possível gerar o mapa.');
    }

    await interaction.editReply({
      content: '🔥 Risco de incêndio em Portugal (mapa atualizado)',
      files: [
        {
          attachment: result.attachment,
          name: result.name,
        },
      ],
    });
  },  
};
