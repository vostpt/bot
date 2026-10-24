const { SlashCommandBuilder } = require('discord.js');
const moment = require('moment');
const { Sns } = require('../services');
const { editReplyInChunks } = require('../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('sns24')
    .setDescription('Mostra alertas do SNS24')
    .addStringOption(option =>
      option
        .setName('opcao')
        .setDescription('Tipo de informação SNS24')
        .setRequired(true)
        .addChoices(
          { name: 'Alerts', value: 'alerts' },
        )
    ),

    async execute(interaction) {
        try {

        await interaction.deferReply();

        const data = await Sns.getAlerts();

            if (!data || data.length === 0) {
            return await interaction.editReply('***Sem Alertas***');
            }

            const events = data.map((item) =>
            `**${item.title}**\n${item.description}\n${item.link}\n${moment(item.dateTime, moment.ISO_8601)}`
            );

        return editReplyInChunks(interaction, `***SNS24 Alertas:***\n\n${events.join('\n\n')}`);

        } catch (err) {
        console.error(err);

            if (interaction.deferred || interaction.replied) {
            await interaction.followUp('❌ Erro ao executar sns24.');
            } else {
            await interaction.reply('❌ Erro ao executar sns24.');
            }
        }
    }
};
