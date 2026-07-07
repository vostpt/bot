const { SlashCommandBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("clear")
    .setDescription("Apaga mensagens do canal")
    .addIntegerOption(option =>
      option.setName("quantidade")
        .setDescription("Número de mensagens para apagar (1-100)")
        .setRequired(true)
    ),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
      return interaction.reply({
        content: "❌ Você não tem permissão para isso.",
        ephemeral: true
      });
    }

    const amount = interaction.options.getInteger("quantidade");

    if (amount < 1 || amount > 100) {
      return interaction.reply({
        content: "⚠️ Escolhe um número entre 1 e 100.",
        ephemeral: true
      });
    }

    await interaction.channel.bulkDelete(amount, true);

    await interaction.reply({
      content: `🧹 ${amount} mensagens apagadas!`,
      ephemeral: false
    });
  }
};