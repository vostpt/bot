const { SlashCommandBuilder } = require('discord.js');

const responses = [
  'Nível de cafeína: mobilização total. ☕ (Indicador não oficial.)',
  'Nível de cafeína: em fase de reconhecimento da máquina. ☕',
  'Nível de cafeína: uma chávena de distância da prontidão. ☕',
  'Nível de cafeína: redundância operacional ativada. ☕☕',
  'Nível de cafeína: a equipa pediu para não fazer mais reuniões antes do café. ☕',
  'Nível de cafeína: estável. Este relatório foi aprovado por ninguém. ☕',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cafe')
    .setDescription('Consulta o indicador não oficial de cafeína da equipa'),

  async execute(interaction) {
    const index = Math.floor(Math.random() * responses.length);
    await interaction.reply({
      content: `☕ Indicador não oficial — ${responses[index]}`,
      ephemeral: true,
    });
  },
};
