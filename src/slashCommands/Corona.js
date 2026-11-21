const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('corona')
    .setDescription('Gestão dos relatórios COVID')

    .addSubcommand(sub =>
      sub
        .setName('reports')
        .setDescription('Lista todos os relatórios')
    )

    .addSubcommand(sub =>
      sub
        .setName('resumo')
        .setDescription('Resumo de um boletim')
        .addStringOption(opt =>
          opt
            .setName('data')
            .setDescription('HOJE ou DDMMMAAAA')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('update')
        .setDescription('Atualiza a spreadsheet')
        .addStringOption(opt =>
          opt.setName('data')
            .setDescription('HOJE ou DDMMMAAAA')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('confirmados')
            .setDescription('Casos confirmados')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('hospitalizados')
            .setDescription('Hospitalizados')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('uci')
            .setDescription('UCI')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('obitos')
            .setDescription('Óbitos')
            .setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName('recuperados')
            .setDescription('Recuperados')
            .setRequired(true)
        )
    )

    .addSubcommand(sub =>
      sub
        .setName('notify')
        .setDescription('Envia notificações')
        .addStringOption(opt =>
          opt.setName('relatorio')
            .setDescription('URL do relatório')
            .setRequired(true)
        )
        .addAttachmentOption(opt =>
          opt.setName('anexo')
            .setDescription('Ficheiro (imagem ou PDF)')
            .setRequired(true)
        )
    ),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    if (sub === 'reports') {
      await interaction.reply('reports...');
    }

    if (sub === 'resumo') {
      const data = interaction.options.getString('data');
      await interaction.reply(`resumo ${data}`);
    }

    if (sub === 'update') {
      await interaction.reply('update...');
    }

    if (sub === 'notify') {
      const url = interaction.options.getString('relatorio');
      const file = interaction.options.getAttachment('anexo');

      await interaction.reply(`notify: ${url} + ${file.url}`);
    }
  }
};
