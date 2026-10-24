const { SlashCommandBuilder } = require('discord.js');
const { Prociv } = require('../services');
const { editReplyInChunks } = require('../helpers');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('stats')
    .setDescription('Mostra estatísticas das ocorrências e meios envolvidos'),

  async execute(interaction) {
    try {

      await interaction.deferReply();

      const occurrences = await Prociv.getAll();

      const counters = {};
      let totalCounters = [0, 0, 0, 0];

      occurrences.forEach((element) => {
        const {
          o: operatives,
          t: vehicles,
          a: aircrafts,
          ide: statusId,
        } = element;

        const elementValues = [1, operatives, vehicles, aircrafts];

        totalCounters = totalCounters.map((val, index) => val + elementValues[index]);

        if (!(statusId in counters)) {
          counters[statusId] = elementValues;
        } else {
          counters[statusId] = counters[statusId].map(
            (val, index) => val + elementValues[index]
          );
        }
      });

      let messageText =
`🔥 **Situação operacional nacional**
Total:
🔥 ${totalCounters[0]} | 👨‍🚒 ${totalCounters[1]} | 🚒 ${totalCounters[2]} | 🚁 ${totalCounters[3]}

`;

      Object.keys(counters).forEach((statusId) => {
        messageText +=
`**${Prociv.statusIdToDesc[statusId]}**
🔥 ${counters[statusId][0]} | 👨‍🚒 ${counters[statusId][1]} | 🚒 ${counters[statusId][2]} | 🚁 ${counters[statusId][3]}

`;
      });

      await editReplyInChunks(interaction, messageText);

    } catch (err) {
      console.error(err);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp('❌ Erro ao executar stats.');
      } else {
        await interaction.reply('❌ Erro ao executar stats.');
      }
    }
  },
};
