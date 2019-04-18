const moment = require('moment');

const PERSONAL_MESSAGES = {
  1318: 'aqui tens o teu chá verde :tea:',
  5850: 'aqui tens o teu chá verde quentinho :tea:',
  2458: 'já sei que não bebes café. Aceita antes um chá :tea:',
  7744: 'aqui está o teu chá! :tea:',
  2908: 'duplo curto, como gostas, certo? :coffee:',
  6984: 'tu, café? Ainda és uma criança, toma lá um copo de leite :milk:',
};

module.exports = {
  name: 'greetings',
  description: 'Greeting people',
  async execute(message) {
    const messageContent = message.content.toLowerCase();
    const hour = parseInt(moment(message.createdTimestamp).format('H'), 10);

    if (messageContent.includes('bom dia')) {
      try {
        if (hour >= 13 && hour < 20) {
          message.reply('Para mim já é boa tarde! (*mas isso sou eu que só tenho o cérebro do tamanho do universo*) ');
        } else if (hour >= 20) {
          message.reply('Para mim já é boa Noite! **Estás bem?**');
        } else if (hour < 6) {
          message.reply('Já de pé a estas horas? **ALVORADA!!!!!!**');
        } else {
          const personalMessage = PERSONAL_MESSAGES[message.author.discriminator];

          if (personalMessage) {
            message.reply(`Bom Dia, ${personalMessage}`);
          } else {
            message.reply('Bom Dia, aqui tens o teu café :coffee:');
          }

          return;
        }
      } catch (e) {
      //
      }
    }

    // Good Afternoon routine

    if (messageContent.includes('boa tarde')) {
      try {
        if (hour < 12) {
          message.reply('Ainda não é boa tarde, digo eu que só tenho o cérebro do tamanho do universo.');
        } else if (hour < 15) {
          message.reply('Olá boa tarde, já almoçaste?');
        } else if (hour < 17) {
          message.reply('Olá boa tarde, tudo bem contigo?');
        } else if (hour < 19) {
          message.reply('Boas! Vai um lanchinho? :milk: :cake:');
        } else {
          message.reply('Tarde?? Viesses mais cedo :thinking:');
        }
      } catch (e) {
      //
      }
    }

    // Good Night routine
    if (messageContent.includes('boa noite')) {
      try {
        if (hour >= 7 && hour <= 19) {
          message.reply('Boa noite? Estás em que fuso horário?');
        } else if (hour >= 20 && hour <= 23) {
          message.reply('Boa noit, já jantaste?');
        } else {
          message.reply('Por aqui a estas horas? Deves ser developer, ou estamos activados e ninguém me disse :thinking:');
        }
      } catch (e) {
      //
      }
    }
  },
};
