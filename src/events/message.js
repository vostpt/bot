const moment = require('moment');
const { locale } = require('../../config/locale');
const { prefix } = require('../../config/bot');
const { react } = require('../helpers');
const {
  sendMessageToAuthor,
  sendMessageAnswer,
  sendMessageToChannel,
} = require('../services/Discord');

moment.locale(locale);

const prefixHelp = '?';

const replies = [
  'Provavelmente a melhor VOST do mundo',
  ':eyes:',
  ':heart:',
  'Sabiam que a VOSTPT primeiro se chamou CONAC-TW no Twitter?',
  'Laravel Laravel Laravel all the way! How much fun it is to code in a modern way-hey!',
  ':heart: Galileo! Galileo! Galileo Cloudflario :heart:',
  'Desculpem-me por respirar, coisa que nunca faço porque sou apenas código mas se fosse um ser vi... estou tão deprimida',
  'Eu prefiria que apenas me dessem coisas para fazer, porque esta coisa da interacção social não é **mesmo** para mim',
  'Eu tenho uma capacidade tão grande de cálculo que, se pensarem agora num número, eu já sei que é o número errado',
  'Eu posso ter milhões de ideias ao mesmo tempo. Todas elas apontam para uma activação em breve',
  'Eu podia calcular as hipóteses de sobrevivermos a mais uma activação se usarmos Google Forms, mas vocês iam-me detestar ainda mais do que me detestam',
  'A melhor conversa que eu alguma vez tive na minha vida foi com uma máquina de café',
  'Tenho estado a falar com o servidor onde o site está alojado. Nem queiram saber o que ele me disse!',
  'Se calhar poupava imenso trabalho a toda a gente e apagava-me a mim mesma',
  'Tia isto, Tia aquilo. Tenho a capacidade de guiar um satélite até Marte, e pedem-me café',
  ':musical_note: The servers are alive with the sound of coding :musical_note:',
  'Se o código é amigo cá da malta! Tem que compilar, tem que compilar até ao fim!',
];

/**
 * Grab random message from the replies list
 */
const getRandomMessage = () => replies[Math.floor(Math.random() * replies.length)];

/**
* Receives a message from Discord, and execute trigger(s) included in it
*
* @async
* @param {Client} client
* @param {Message} msg
*/
const message = async (client, msg) => {
  if (msg.author.bot) {
    return;
  }

  if (msg.isMemberMentioned(client.user)) {
    sendMessageToChannel(msg.channel, getRandomMessage());
  }

  const { id: channelId } = msg.channel;

  client.triggers.forEach(({ execute, limitToChannels }) => {
    if (!limitToChannels || limitToChannels.length <= 0 || limitToChannels.includes(channelId)) {
      execute(msg, client);
    }
  });

  if (msg.content.startsWith(prefixHelp)) {
    const args = msg.content.slice(prefixHelp.length).split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'commands') {
      const commandUsage = client.commands
        .filter(({ active }) => active)
        .map(({ usage }) => usage);

      sendMessageToAuthor(msg, `***Comandos:***\n${commandUsage.join('')}`);

      react(msg, ['📧', '📥']);
    }
  }

  if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    /* eslint-disable max-len */
    const command = client.commands.find(({ name, aliases = [] }) => (name === commandName) || aliases.includes(commandName));

    if (!command) {
      sendMessageToAuthor(msg, `${prefix}${commandName} não existe. Experimenta ${prefixHelp}commands`);

      react(msg, ['📧', '📥']);

      return;
    }

    if (command.limitToChannels && command.limitToChannels.length > 0 && !command.limitToChannels.includes(channelId)) {
      return;
    }

    if (!command.active) {
      sendMessageToAuthor(msg, `O comando *${prefix}${commandName}* encontra-se desativado.`);

      react(msg, ['📧', '📥']);

      return;
    }

    try {
      const now = Date.now();
      const timestamps = client.cooldowns.get(command.name);
      const cooldownAmount = (command.cooldown) * 1000;

      if (timestamps.has(msg.author.id)) {
        const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000;

          sendMessageToAuthor(msg, `Por favor espera ${Math.ceil(timeLeft)} segundo(s) antes de requisitares \`${prefix}${command.name}\` novamente.`);

          react(msg, ['📧', '📥']);

          return;
        }
      }

      await command.execute(msg, args);

      timestamps.set(msg.author.id, now);

      setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
    } catch (e) {
      // log exception
      sendMessageAnswer(msg, 'infelizmente não consigo satisfazer esse pedido');
      console.error(e);
    }
  }
};

module.exports = message;
