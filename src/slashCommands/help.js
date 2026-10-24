const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
} = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Mostra todos os comandos disponíveis'),

  async execute(interaction) {
    const slashCommands = interaction.client.slashCommands;
    const prefixCommands = interaction.client.prefixCommands;

    const getDescription = (cmd) =>
      cmd.data?.description ?? cmd.description ?? 'Sem descrição';

    const categories = {
      slash: {
        '🚒 Proteção Civil': [],
        '🌍 Informação': [],
        '⚙️ Utilitários': [],
        '📊 Outros': [],
      },
      prefix: {
        '🚒 Proteção Civil': [],
        '🌍 Informação': [],
        '⚙️ Utilitários': [],
        '📊 Outros': [],
      }
    };

    for (const cmd of slashCommands.values()) {
      const name = cmd.data.name;
      const desc = getDescription(cmd);

      const line = `\`/${name}\` — ${desc}`;

      if (['all', 'op', 'alerts', 'rcm', 'stats'].includes(name)) {
        categories.slash['🚒 Proteção Civil'].push(line);
      }
      else if (['weather', 'sismos', 'sns24', 'corona', 'acronimo'].includes(name)) {
        categories.slash['🌍 Informação'].push(line);
      }
      else if (['ping', 'debug', 'clear'].includes(name)) {
        categories.slash['⚙️ Utilitários'].push(line);
      }
      else {
        categories.slash['📊 Outros'].push(line);
      }
    }

    for (const cmd of prefixCommands.values()) {
      const name = cmd.name;
      const desc = getDescription(cmd);

      const line = `\`!${name}\` — ${desc}`;

      if (['all', 'op', 'alerts', 'rcm', 'stats'].includes(name)) {
        categories.prefix['🚒 Proteção Civil'].push(line);
      }
      else if (['weather', 'sismos', 'sns24', 'corona', 'acronimo'].includes(name)) {
        categories.prefix['🌍 Informação'].push(line);
      }
      else if (['ping', 'debug', 'clear'].includes(name)) {
        categories.prefix['⚙️ Utilitários'].push(line);
      }
      else {
        categories.prefix['📊 Outros'].push(line);
      }
    }

    const buildEmbed = (type, category) => {
      const data = categories[type][category];

      return new EmbedBuilder()
        .setColor(0x1e1f22)
        .setTitle(`📖 VOST APP • Ajuda`)
        .setDescription(`Categoria: **${category}**`)
        .addFields({
          name: '📜 Comandos',
          value: data.join('\n') || 'Nenhum comando',
        })
        .setFooter({ text: 'Use o menu abaixo para navegar' })
        .setTimestamp();
    };

    const menu = new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Escolhe uma categoria...')
      .addOptions([
        {
          label: '🚒 Proteção Civil (Slash)',
          value: 'slash_protecao',
        },
        {
          label: '🌍 Informação (Slash)',
          value: 'slash_info',
        },
        {
          label: '⚙️ Utilitários (Slash)',
          value: 'slash_utils',
        },
        {
          label: '📊 Outros (Slash)',
          value: 'slash_outros',
        },
        {
          label: '⌨️ Prefix Commands',
          value: 'prefix_all',
        },
      ]);

    const row = new ActionRowBuilder().addComponents(menu);

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor(0x1e1f22)
          .setTitle('📖 VOST APP • Help Menu')
          .setDescription('Escolhe uma categoria no menu abaixo 👇')
          .setTimestamp()
      ],
      components: [row],
      ephemeral: true,
    });

    const msg = await interaction.fetchReply();

    const collector = msg.createMessageComponentCollector({
      time: 120000,
    });

    collector.on('collect', async (i) => {
      if (i.customId !== 'help_menu') return;

      let embed;

      switch (i.values[0]) {

        case 'slash_protecao':
          embed = buildEmbed('slash', '🚒 Proteção Civil');
          break;

        case 'slash_info':
          embed = buildEmbed('slash', '🌍 Informação');
          break;

        case 'slash_utils':
          embed = buildEmbed('slash', '⚙️ Utilitários');
          break;

        case 'slash_outros':
          embed = buildEmbed('slash', '📊 Outros');
          break;

        case 'prefix_all':
          embed = new EmbedBuilder()
            .setColor(0x1e1f22)
            .setTitle('⌨️ Prefix Commands')
            .setDescription('Lista de comandos `!` disponíveis')
            .addFields(
              Object.entries(categories.prefix).map(([k, v]) => ({
                name: k,
                value: v.join('\n') || 'Nenhum comando',
              }))
            )
            .setTimestamp();
          break;
      }

      await i.update({
        embeds: [embed],
        components: [row],
      });
    });
  },
};
