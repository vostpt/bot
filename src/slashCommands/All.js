const { SlashCommandBuilder } = require('discord.js');

const {
  Prociv,
  Fires,
} = require('../services');

const { editReplyInChunks, isSevere } = require('../helpers');

function formatOccurrence(o) {
  return `${o.d} - ${o.id} - #IR${o.l}, #${o.s} - ${o.o}👨‍🚒 ${o.t}🚒 ${o.a}🚁 - ${o.e}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('all')
    .setDescription('Consulta ocorrências da Proteção Civil')

    .addSubcommand(sub =>
      sub
        .setName('list')
        .setDescription('Todas as ocorrências')
    )

    .addSubcommand(sub =>
      sub
        .setName('links')
        .setDescription('Links fogos.pt')
    )

    .addSubcommand(sub =>
      sub
        .setName('human')
        .setDescription('Filtrar por operacionais')
        .addIntegerOption(opt =>
          opt
            .setName('operacionais')
            .setDescription('Número mínimo de operacionais')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('ground')
        .setDescription('Filtrar por meios terrestres')
        .addIntegerOption(opt =>
          opt
            .setName('veiculos')
            .setDescription('Número mínimo de veículos')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('air')
        .setDescription('Filtrar por meios aéreos')
        .addIntegerOption(opt =>
          opt
            .setName('aereos')
            .setDescription('Número mínimo de meios aéreos')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('important')
        .setDescription('Ocorrências importantes')
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const sub = interaction.options.getSubcommand();

    const events = [];
    const relevant = [];

    try {

      if (sub === 'list') {
        const occurrences = await Prociv.getAll();

        for (const o of occurrences) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'links') {
        const occurrences = await Prociv.getAll();

        for (const o of occurrences) {
          const msg = `#IR${o.l}, #${o.s} - https://fogos.pt/fogo/2019${o.id}`;

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'human') {
        const min = interaction.options.getInteger('operacionais');

        const occurrences =
          await Prociv.filterByMinimumOperatives(min);

        for (const o of occurrences) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'ground') {
        const min = interaction.options.getInteger('veiculos');

        const occurrences =
          await Prociv.filterByMinimumVehicles(min);

        for (const o of occurrences) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'air') {
        const min = interaction.options.getInteger('aereos');

        const occurrences =
          await Prociv.filterByMinimumAircrafts(min);

        for (const o of occurrences) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'important') {
        const fires = await Fires.getImportantForestFires();

        for (const f of fires) {
          events.push(
            `__**${f.id} - #IR${f.l}, #${f.s} - ${f.i} ${f.ps ? `- ${f.ps}` : ''}**__`
          );
        }
      }

      let output = '';

      if (relevant.length) {
        output += `🔥 **Relevantes:**\n${relevant.join('\n')}\n\n`;
      }

      if (events.length) {
        output += `🚒 **Ocorrências:**\n${events.join('\n')}`;
      }

      return editReplyInChunks(interaction, output || '🔥 Sem Ocorrências');

    } catch (err) {
      console.error(err);
      return interaction.editReply('❌ Erro ao processar comando');
    }
  },
};
