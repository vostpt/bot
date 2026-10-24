const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const { Acronyms } = require('../services');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('acronimo')
    .setDescription('Consulta a definição de um acrónimo')
    .addStringOption(option =>
      option
        .setName('sigla')
        .setDescription('Acrónimo a pesquisar')
        .setRequired(true)
    ),

  async execute(interaction) {
    const acronym = interaction.options
      .getString('sigla')
      .trim()
      .toUpperCase();

    await interaction.deferReply();

    try {
      const { data } =
        await Acronyms.getExactAcronym(acronym);

      if (!data?.length) {
        return interaction.editReply(
          `❌ Não reconheço o acrónimo \`${acronym}\`.`
        );
      }

      const [result] = data;

      const embed = new EmbedBuilder()
        .setTitle(`📖 ${result.attributes.initials}`)
        .setDescription(result.attributes.meaning)
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(error);

      await interaction.editReply(
        '❌ Ocorreu um erro ao consultar a base de dados.'
      );
    }
  },
};
