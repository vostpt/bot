const moment = require('moment');
const { channels } = require('../../config/bot');
const { removeAccent } = require('../helpers');

const PERSONAL_MESSAGES = {
  1318: 'aqui tens o teu chá verde :tea:',
  5850: 'aqui tens o teu chá verde quentinho :tea:',
  2458: 'já sei que não bebes café. Aceita antes um chá :tea:',
  7744: 'aqui está o teu chá! :tea:',
  2908: 'mais trabalho, Jorge?! Toma lá, um duplo curto :coffee:',
  6984: 'Já estás um homenzinho! Toma lá um café!',
  8386: 'aqui tens o teu chá preto, que eu não me esqueço nunca :tea: (buéda terabytes de memória, yo)',
  1905: 'ora aqui está um chá fresquinho bem quentinho. Se quiseres uma farripa de leite é só dizer.',
  5652: 'sei que não bebes café, por isso toma lá um chá e não digas que vais daqui :tea:',
  6044: 'um café rápido para um homem rápido!',
  '0268': 'meu mais que tudo, meu pai, meu Deus, basta pedires e farei acontecer! :hearts:',
  7982: 'MONSTER MONSTER, toma lá MONSTER!',
  4585: 'Bonjour! Prenez un café et une tarte à la crème!',
};

const GREETINGS_BOM_DIA = [
  'bomdia',
  'bonsdias',
  'buenosdias',
  'goodmorning',
  'bonjour',
  'bomdjia',
  'boumdia',
  'Bom di. A',
  'Kaliméra',
  'G”Day',
  'GM',
  'Buongiorno',
];

const GREETINGS_BOA_TARDE = [
  'boatarde',
  'boastardes',
  'buenastardes',
  'goodafternoon',
  'bonapresmidi',

];

const GREETINGS_BOA_NOITE = [
  'boanoite',
  'boasnoites',
  'buenasnoches',
  'goodevening',
  'bonsoir',
  'bonnenuit',

];

module.exports = {
  name: 'greetings',
  description: 'Greeting people',
  limitToChannels: [
    channels.TRIGGERS_CHANNEL_ID,
    channels.VOLUNTEERS_CHANNEL_ID,
  ],

  /**
  * Send to Discord a greeting message according to time and/or user,
  * (if user has a defined custom message in PERSONAL_MESSAGES)
  *
  * @async
  * @param {Message} message
  */
  async execute(message) {
    const messageContent = removeAccent(message.content.toLowerCase().replace(/\s+/g, ''));
    const hour = parseInt(moment(message.createdTimestamp).format('H'), 10);

    if (GREETINGS_BOM_DIA.some((greeting) => messageContent.includes(greeting))) {
      try {
        if (hour >= 13 && hour < 20) {
          message.reply('para mim já é boa tarde! (*mas isso sou eu que só tenho o cérebro do tamanho do universo*) ');
        } else if (hour >= 20) {
          message.reply('para mim já é boa Noite! **Estás bem?**');
        } else if (hour < 6) {
          message.reply('já de pé a estas horas?!? **ALVORADA!!!!!!**');
        } else {
          const personalMessage = PERSONAL_MESSAGES[message.author.discriminator];

          if (personalMessage) {
            message.reply(`bom dia, ${personalMessage}`);
          } else {
            message.reply('bom dia, aqui tens o teu café :coffee:');
          }

          return;
        }
      } catch (e) {
      //
      }
    }

    // Good Afternoon routine

    if (GREETINGS_BOA_TARDE.some((greeting) => messageContent.includes(greeting))) {
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
    if (GREETINGS_BOA_NOITE.some((greeting) => messageContent.includes(greeting))) {
      try {
        if (hour >= 7 && hour <= 19) {
          message.reply('Boa noite? Estás em que fuso horário?');
        } else if (hour >= 20 && hour <= 23) {
          message.reply('Boa noite, já jantaste?');
        } else {
          message.reply('por aqui a estas horas? Deves ser developer, ou estamos activados e ninguém me disse :thinking:');
        }
      } catch (e) {
      //
      }
    }
  },
};
