const {
  SlashCommandBuilder,
  EmbedBuilder,
} = require('discord.js');

const ip = require('ip');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('debug')
    .setDescription('Mostra informações de diagnóstico do bot'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    try {
      let publicIp = 'Não disponível';

      try {
        const response = await fetch(
          'https://api.ipify.org?format=json'
        );

        const data = await response.json();
        publicIp = data.ip;
      } catch {
      }

      const versions = Object.entries(process.versions)
        .map(([key, value]) => `• ${key}: ${value}`)
        .join('\n');

      const memory = (
        process.memoryUsage().heapUsed /
        1024 /
        1024
      ).toFixed(2);

      const uptimeSeconds = Math.floor(process.uptime());

      const embed = new EmbedBuilder()
        .setTitle('🔧 Debug')
        .addFields(
          {
            name: '🌐 Rede',
            value:
              `IP Local: \`${ip.address()}\`\n` +
              `IP Público: \`${publicIp}\``,
          },
          {
            name: '🖥 Sistema',
            value:
              `Node.js: \`${process.version}\`\n` +
              `Memória: \`${memory} MB\`\n` +
              `Uptime: \`${uptimeSeconds}s\``,
          },
          {
            name: '📦 Versões',
            value: `\`\`\`\n${versions.slice(0, 1000)}\n\`\`\``,
          }
        )
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
      });

    } catch (error) {
      console.error(error);

      await interaction.editReply(
        '❌ Erro ao obter informações de debug.'
      );
    }
  },
};