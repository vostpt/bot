
const { Rally } = require('../services');
const { cooldown, userLists, roleLists } = require('../../config/bot');
const { sendMessageAnswer } = require('../services/Discord');

module.exports = {
  active: true,
  allowedArgs: [
    'upload',
    'update',
  ],
  args: true,
  cooldown,
  name: 'rally',
  usage: `
    **!rally upload *[comando restrito | obrigatório anexar 1 ficheiro]*** - Faz o upload de um ficheiro csv para o site do Rally de Portugal. Usando este comando, não serão enviadas publicações para as redes sociais.
    **!rally update <ID da ZE> <Lotação> *[comando restrito]*** - Atualiza a lotação de uma determinada ZE. Ao atualizar por este comando, caso a ZE passe para laranja ou vermelho, serão enviados posts para as redes sociais do Rally.
    `,

  /**
  * Send to Discord all coronavirus reports made by DGS
  * Or send to Discord DGS daily report resume
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      sendMessageAnswer(message, `falta o parâmetro.\n${this.usage}`);

      return;
    }

    // upload and update commands are restricted

    const checkUserAuth = () => {
      const userId = message.author.id;

      const authUser = userLists.rallyUpdate.includes(userId);

      if (authUser) {
        return true;
      }

      if (message.channel.type === 'dm') {
        return false;
      }

      const authRole = roleLists.rallyUpdate.some((role) => message.member.roles.has(role));

      return authRole;
    };

    if (!checkUserAuth()) {
      sendMessageAnswer(message, 'não tens permissão para usar o comando');

      return;
    }

    try {
      const requestedParam = args[0].toLowerCase();

      if (requestedParam === 'upload') {
        const attachmentURLs = message.attachments.map((attachment) => attachment.url);

        const numAttachments = attachmentURLs.length;

        if (numAttachments !== 1) {
          sendMessageAnswer(message, `foram enviados ${numAttachments} anexos, quando deveria ter sido enviado 1 -> Tenta outra vez`);

          return;
        }
        
        Rally.uploadCsv(attachmentURLs[0]);

        sendMessageAnswer(message, 'notificação enviada');

        return;
      }

      if (requestedParam === 'update') {
        if (args.length < 3) {
          sendMessageAnswer(message, `faltam valores.\n${this.usage}`);

          return;
        }

        const res = await Rally.updateCapacity(args[1], args[2]);

        if (res < 0) {
          sendMessageAnswer(message, `não foi encontrada nenhuma zona com este nome. Tenta outra vez`);

          return;
        }

        sendMessageAnswer(message, `CSV atualizado e notificação enviada`);

        return;
      }

      if (requestedParam === 'info') {
        if (args.length < 2) {
          sendMessageAnswer(message, `falta introduzir o texto.\n${this.usage}`);

          return;
        }

        const text = args.slice(1).join(' ');

        await Rally.sendInfo(text);

        sendMessageAnswer(message, `notificação enviada`);

        return;
      }

  } catch (e) {
    sendMessageAnswer(message, `ocorreu um erro.\nDebug: \`\`\`${e}\`\`\``);
  }

    sendMessageAnswer(message, `desconheço essa opção.\n${this.usage}`);
  },
};
