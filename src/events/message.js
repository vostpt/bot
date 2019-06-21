const moment = require('moment');
const { locale } = require('../../config/locale');
const { prefix, channels } = require('../../config/bot');

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
  'Eu posso ter milhões  de ideias ao mesmo tempo. Todas elas apontam para uma activação em breve',
  'Eu podia calcular as hipóteses de sobrevivermos a mais uma activação se usarmos Google Forms, mas vocês iam-me detestar ainda mais do que me detestam',
  'A melhor conversa que eu alguma vez tive na minha vida foi com uma máquina de café',
  'Tenho estado a falar com o servidor onde o site está alojado. Nem queiram saber o que ele me disse!',
  'Se calhar poupava imenso trabalho a toda a gente e apagava-me a mim mesmo',
  'Tia isto, Tia aquilo. Tenho a capacidade de guiar um satélite até Marte, e pedem-me café',
  ':musical_note: The servers are alive with the sound of coding :musical_note:',
  'Se o código é amigo cá da malta! Tem que pullar, tem que pullar até ao fim!',
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
    msg.channel.send(getRandomMessage());

    return;
  }

  const { id: channelId } = msg.channel;

  if (channelId === channels.TRIGGERS_CHANNEL_ID) {
    client.triggers.forEach(({ execute }) => execute(msg, client));
  }

  if (msg.content.startsWith(prefixHelp)) {
    const args = msg.content.slice(prefixHelp.length).split(' ');
    const command = args.shift().toLowerCase();

    if (command === 'commands') {
      const commandUsage = client.commands.map(({ usage }) => usage);

      msg.author.send(`***Comandos:***\n${commandUsage.join('')}`);

      msg.react('📧')
        .then(() => msg.react('📥'))
        .catch(() => msg.reply('os comandos foram enviados por DM'));
    }
  }

  if (msg.content.startsWith(prefix)) {
    const args = msg.content.slice(prefix.length).split(' ');
    const commandName = args.shift().toLowerCase();

    const command = client.commands.get(commandName);

    if (command) {
      try {
        const now = Date.now();
        const timestamps = client.cooldowns.get(commandName);
        const cooldownAmount = (command.cooldown) * 1000;

        if (timestamps.has(msg.author.id)) {
          const expirationTime = timestamps.get(msg.author.id) + cooldownAmount;

          if (now < expirationTime) {
            const timeLeft = (expirationTime - now) / 1000;

            msg.author.send(`Por favor espera ${Math.ceil(timeLeft)} segundo(s) antes de requisitares \`${prefix}${command.name}\` novamente.`);

            return;
          }
        }

        await command.execute(msg, args);

        timestamps.set(msg.author.id, now);

        setTimeout(() => timestamps.delete(msg.author.id), cooldownAmount);
      } catch (e) {
        msg.reply('infelizmente não consigo satisfazer esse pedido');
      }
    }
  }
};

module.exports = message;
