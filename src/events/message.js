const moment = require('moment');
const { locale } = require('../../config/locale');
const { prefix } = require('../../config/bot');

moment.locale(locale);

const message = (client, msg) => {
  if (msg.author.bot) {
    return;
  }

  const prefixHelp = '?';

  if (msg.content.toLowerCase().includes('vostpt')) {
    const replies = [
      'Provavelmente a melhor VOST do mundo',
      ':eyes:',
      ':heart:',
      'Sabias que a VOSTPT primeiro se chamou CONAC-TW no Twitter?',
    ];
    const replytext = Math.floor(Math.random() * replies.length + 0);
    try {
      msg.reply(replies[replytext]);
    } catch (e) {
      //
    }

    return;
  }

  // catering
  // Morning Routine

  if (msg.content.toLowerCase().includes('bom dia')) {
    const hora = parseInt(moment(msg.createdTimestamp).format('H'), 10);
    let msgString = '';

    if (hora >= 13 && hora < 20) {
      msgString = 'Para mim já é boa tarde! (*mas isso sou eu que só tenho o cérebro do tamanho do universo*) ';
    } else if (hora >= 20) {
      msgString = 'Para mim já é boa Noite! **Estás bem?**';
    } else if (hora < 6) {
      msgString = 'Já de pé a estas horas? **ALVORADA!!!!!!**';
    } else {
      msgString = 'Bom Dia, ';
      switch (msg.author.discriminator) {
        case '1318':
          msgString += 'aqui tens o teu chá verde :tea:';
          break;
        case '5850':
          msgString += 'aqui tens o teu chá verde quentinho :tea:';
          break;
        case '2458':
          msgString += 'já sei que não bebes café. Aceita antes um chá :tea:';
          break;
        case '7744':
          msgString += 'aqui está o teu chá! :tea:';
          break;
        case '2908':
          msgString += 'duplo curto, como gostas, certo? :coffee:';
          break;
        case '6984':
          msgString += 'tu, café? Ainda és uma criança, toma lá um copo de leite :milk:';
          break;
        default:
          msgString += 'aqui tens o teu café :coffee:';
          break;
      }
    }

    try {
      msg.reply(msgString);
    } catch (e) {
      //
    }
  }

  // Good Afternoon routine

  if (msg.content.toLowerCase().includes('boa tarde')) {
    const hour = parseInt(moment(msg.createdTimestamp).format('H'), 10);

    let msgString = 'Tarde?? Viesses mais cedo :thinking:';

    if (hour < 12) {
      msgString = 'Ainda não é boa tarde, digo eu que só tenho o cérebro do tamanho do universo.';
    } else if (hour < 15) {
      msgString = 'Olá boa tarde, já almoçaste?';
    } else if (hour < 17) {
      msgString = 'Olá boa tarde, tudo bem contigo?';
    } else if (hour < 19) {
      msgString = 'Boas! Vai um lanchinho? :milk: :cake:';
    }

    try {
      msg.reply(msgString);
    } catch (e) {
      //
    }
  }

  // Good Night routine
  if (msg.content.toLowerCase().includes('boa noite')) {
    const hour = parseInt(moment(msg.createdTimestamp).format('H'), 10);

    let msgString = 'Por aqui a estas horas? Deves ser developer, ou estamos activados e ninguém me disse :thinking:';

    if (hour >= 7 && hour <= 19) {
      msgString = 'Boa noite? Estás em que fuso horário?';
    } else if (hour >= 20 && hour <= 23) {
      msgString = 'Boa noit, já jantaste?';
    }

    try {
      msg.reply(msgString);
    } catch (e) {
      //
    }
  }

  if (msg.content === '!coffee') {
    msg.channel.send(`@everyone A pedido de ${msg.author} tomem lá um café! :coffee:`);
  }

  if (msg.content === '!champagne') {
    msg.channel.send(`@everyone A pedido de ${msg.author} vamos todos celebrar :champagne: :champagne_glass:`);
  }

  // End Catering

  // Foul Language
  if (msg.content.toLowerCase().includes('merda')) {
    msg.reply('Hey https://media1.tenor.com/images/ff97f5136e14b88c76ea8e8488e23855/tenor.gif?itemid=13286953');
  }
  // End Foul Language

  // Teaching
  if (msg.content.toLowerCase().includes('voluntários')) {
    msg.reply(
      'Desculpa interromper, mas na VOST Portugal ser voluntário é trabalhar para a invisibilidade e sempre com transparência',
    );
  }

  if (msg.content.toLowerCase().includes('💪')) {
    msg.channel.send('Muito vai esta gente ao ginásio, graças a Deus :rolling_eyes: ');
  }

  if (msg.content.toLowerCase().includes('benfica')) {
    msg.reply(':eagle: **SLB! SLB! SLB! SLB! SLB! SLB! Glorioso SLB! GLORIOSO SLB!** :eagle:');
  }

  if (msg.content.toLowerCase().includes('sporting')) {
    msg.reply(':lion_face: **Todo o mundo sabe porque não fico em casa!** :lion_face:');
  }

  if (msg.content.toLowerCase().includes('fcp')) {
    msg.channel.send(
      `:dragon: ${
        msg.author
      } :dragon: **Azul e branco é o coração! E salta Porto! E salta Porto! Allez! Allez!** :dragon:`,
    );
  }

  if (msg.content.toLowerCase().includes('fc porto')) {
    msg.channel.send(
      `:dragon: ${msg.author} :dragon: **E salta Porto! E salta Porto! Allez! Allez!** :dragon:`,
    );
  }

  if (msg.content.toLowerCase().includes('senhorim')) {
    msg.channel.send(
      `:bear: ${msg.author} :bear: **SENHORIM! SENHORIM! QUEM AQUI VEM NÃO MANDA AQUI!** :bear:`,
    );
  }

  if (msg.content.toLowerCase().includes('scb')) {
    msg.channel.send(`${msg.author} **Braga Braga Braga, vamos para a frente!**`);
  }

  if (msg.content.toLowerCase().includes('sc braga')) {
    msg.channel.send(`${msg.author} **Braga Braga Braga, vamos para a frente!**`);
  }
  // End Football
  // End just for fun

  if (msg.content.startsWith(prefixHelp)) {
    const args = msg.content.slice(prefixHelp.length).split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'commands') {
      const commandUsage = client.commands.map(({ usage }) => usage);

      msg.channel.send(`***Comandos:***\n${commandUsage.join('\n')}`);
    }
  }

  if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (command) {
      try {
        command.execute(msg, args);
      } catch (e) {
        //
      }
    }
  }
};

module.exports = message;
