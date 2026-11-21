const { SlashCommandBuilder } = require('discord.js');

const siblings = [
  '🇪🇺 VOST Europe (https://twitter.com/VOSTeurope)',
  '🇫🇷 VISOV France (https://twitter.com/VISOV1)',
  '🇧🇪 VOST Belgique (https://twitter.com/VOSTbe)',
  '🇩🇪 VOST Germany (https://twitter.com/VOST_de)',
  '🇫🇷 VOST Nice (https://twitter.com/NiceVOST)',
  '🇬🇧 VOST UK (https://twitter.com/VOSTUK)',
  '🇮🇹 VOST Italy (https://twitter.com/VOSTitaly)',
  '🇪🇸 VOST Spain (https://twitter.com/vostSPAIN)',
  '🇬🇧 DGVost (https://twitter.com/DGVost)',
];

const socialNetworks = [
  'Twitter: https://twitter.com/vostpt',
  'Facebook: https://pt-pt.facebook.com/Vostpt/',
  'Instagram: https://www.instagram.com/vostpt/',
  'LinkedIn: https://www.linkedin.com/company/vost-portugal/',
  'BlueSky: https://bsky.app/profile/vost.pt',
  'Mastodon: https://masto.pt/@vostpt@trombas.vost.pt',
  'Telegram: https://t.me/vostpt',
];

module.exports = {
  data: new SlashCommandBuilder()
    .setName('vost')
    .setDescription('Informações do VOST Portugal')
    .addStringOption(option =>
      option
        .setName('tipo')
        .setDescription('Escolhe o tipo de informação')
        .setRequired(true)
        .addChoices(
          { name: 'Registo', value: 'registo' },
          { name: 'Redes Sociais', value: 'rs' },
          { name: 'Irmãos', value: 'irmaos' },
        )
    ),

  async execute(interaction) {
    try {

      await interaction.deferReply();

      const option = interaction.options.getString('tipo');

      if (option === 'registo') {
        return await interaction.editReply(
          'Os teus amigos podem se registar neste link: https://t.co/IeLK77Murx?amp=1'
        );
      }

      if (option === 'rs') {

        await interaction.user.send(
          `As nossas redes sociais são:\n${socialNetworks.join('\n')}`
        );

        return await interaction.editReply('📧 Enviado por mensagem privada!');
      }

      if (option === 'irmaos') {
        return await interaction.editReply(
          `Temos muitos irmãos como podes ver:\n${siblings.join('\n')}`
        );
      }

    } catch (err) {
      console.error(err);

      if (interaction.deferred || interaction.replied) {
        await interaction.followUp('❌ Erro ao executar comando vost.');
      } else {
        await interaction.reply('❌ Erro ao executar comando vost.');
      }
    }
  },
};
