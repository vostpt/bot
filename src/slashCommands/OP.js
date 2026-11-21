const {
  SlashCommandBuilder,
} = require('discord.js');

const {
  Fires,
  Winds,
  Prociv,
} = require('../services');

const {
  editReplyInChunks,
  isSevere,
  removeAccent,
} = require('../helpers');

const DISTRICTS = {
  aveiro: '1',
  beja: '2',
  braga: '3',
  bragança: '4',
  castelobranco: '5',
  coimbra: '6',
  evora: '7',
  faro: '9',
  guarda: '10',
  leiria: '11',
  lisboa: '12',
  portalegre: '13',
  porto: '14',
  santarem: '15',
  setubal: '16',
  vianadocastelo: '17',
  vilareal: '18',
  viseu: '19',
};

function formatOccurrence(o) {
  return `${o.d} - ${o.id} - #IR${o.l}, #${o.s} - ${o.o}👨‍🚒 ${o.t}🚒 ${o.a}🚁 - ${o.e}`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('op')
    .setDescription('Consulta ocorrências da Proteção Civil')
    .addSubcommand(sub =>
      sub
        .setName('id')
        .setDescription('Pesquisar por ID')
        .addStringOption(opt =>
          opt.setName('valor')
            .setDescription('ID da ocorrência')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('local')
        .setDescription('Pesquisar por localidade')
        .addStringOption(opt =>
          opt.setName('termo')
            .setDescription('Nome da localidade')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('vento')
        .setDescription('Resumo das estações com vento mais intenso')
    )

    .addSubcommand(sub =>
      sub
        .setName('status')
        .setDescription('Filtrar por estado')
        .addStringOption(opt =>
          opt.setName('estado')
            .setDescription('Estado da ocorrência')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('distrito')
        .setDescription('Filtrar por distrito')
        .addStringOption(opt =>
          opt.setName('nome')
            .setDescription('Nome do distrito')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const sub = interaction.options.getSubcommand();

    const events = [];
    const relevant = [];

    try {

      if (sub === 'id') {
        const id = interaction.options.getString('valor');

        const data = await Prociv.getById(id);

        if (!data.length) {
          return interaction.editReply('🔥 Sem Ocorrências');
        }

        for (const o of data) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'local') {
        const term = removeAccent(
          interaction.options.getString('termo').toLowerCase()
        );

        if (term.length < 3) {
          return interaction.editReply('❌ mínimo 3 caracteres');
        }

        const data = await Prociv.getByCityAndLocal(term);

        if (!data.length) {
          return interaction.editReply('🔥 Sem Ocorrências');
        }

        for (const o of data) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'vento') {
        const data = await Winds.getWindGlobal();

        if (!data) {
          return interaction.editReply('💨🔥 Sem ocorrência');
        }

        return interaction.editReply(
          `💨 **Vento nas estações mais intensas:** ${data.speed} km/h (média de ${data.stations} estações)\nDireção da estação mais intensa: ${data.direction}`
        );
      }

      if (sub === 'status') {
        const status = removeAccent(
          interaction.options.getString('estado').toLowerCase()
        );

        const data = await Prociv.filterByStatus(status);

        if (!data.length) {
          return interaction.editReply('🔥 Sem Ocorrências');
        }

        for (const o of data) {
          const msg = formatOccurrence(o);

          if (isSevere(o)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
        }
      }

      if (sub === 'distrito') {
        const name = interaction.options.getString('nome').toLowerCase();

        const districtId = DISTRICTS[name];

        if (!districtId) {
          return interaction.editReply(
            `❌ distrito inválido\n\n${Object.keys(DISTRICTS).join(', ')}`
          );
        }

        const fires = await Fires.getByDistrict(districtId);

        if (!fires.length) {
          return interaction.editReply('🔥 Sem Ocorrências');
        }

        for (const f of fires) {
          const msg = formatOccurrence(f);

          if (isSevere(f)) relevant.push(`__**${msg}**__`);
          else events.push(msg);
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
      return interaction.editReply('❌ Erro ao processar pedido');
    }
  },
};
