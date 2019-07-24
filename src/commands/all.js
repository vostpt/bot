
const {
  Prociv,
  Fires,
} = require('../services');
const { isSevere } = require('../helpers');
const { cooldown } = require('../../config/bot');

module.exports = {
  name: 'all',
  args: true,
  cooldown,
  allowedArgs: [
    'human',
    'ground',
    'air',
    'important',
    'links',
  ],
  usage: `
    **!all** - *Mostra todas as ocorrências em estado de despacho, em curso ou em resolução.*
    **!all [human|ground|air] [numero_filtrar]** - *Igual ao anterior mas com filtro.*
    **!all links** - *Mostra todas as ocorrências e o link para o fogos.pt em estado de despacho, em curso ou em resolução.*
    **!all important** - *Mostra todas as ocorrências marcadas como importantes na ProCivApi.*
  `,
  description: '',

  /**
  * Send to Discord occurrences, list all (with or without fogos.pt url), or use filters
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    const events = [];
    const importantEvents = [];

    function sendMessages() {
      if (importantEvents.length > 0) {
        message.author.send(`:fire::fire: ***Ocorrências Importantes:***\n${importantEvents.join('\n')}`);
      }

      if (events.length > 0) {
        message.author.send(`:fire: ***Ocorrências:***\n${events.join('\n')}`);
      }

      if (importantEvents.length === 0 && events.length === 0) {
        message.author.send(':fire: ***Sem Ocorrências***');
      }

      message.react('📧')
        .then(() => message.react('📥'))
        .catch(() => message.reply('os comandos foram enviados por DM'));
    }

    if (this.args && args.length === 0) {
      const occurrences = await Prociv.getAll();

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}`;

        if (isSevere(occurrence)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });

      sendMessages();
      return;
    }

    const requestedArgument = args[0].toLowerCase();

    if (!this.allowedArgs.includes(requestedArgument)) {
      message.reply(`${requestedArgument} não é válido.\n${this.usage}`);
      return;
    }

    if (requestedArgument === 'links') {
      const occurrences = await Prociv.getAll();

      occurrences.forEach((occurrence) => {
        const {
          id,
          l: city,
          s: local,
        } = occurrence;

        const msg = `#IF${city}, #${local} - https://fogos.pt/fogo/2019${id}`;

        if (isSevere(occurrence)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'human') {
      if (args.length < 2) {
        message.reply(`falta o numero de operacionais!\n${this.usage}`);

        return;
      }

      const [, amountOfMans] = args;

      const occurrences = await Prociv.filterByMinimumMans(amountOfMans);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}`;

        if (isSevere(occurrence)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'ground') {
      if (args.length < 2) {
        message.reply(`falta o numero de meios terrestres!\n${this.usage}`);

        return;
      }

      const [, amountOfCars] = args;

      const occurrences = await Prociv.filterByMinimumCars(amountOfCars);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}`;

        if (isSevere(occurrence)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'air') {
      if (args.length < 2) {
        message.reply(`falta o numero de meios aéreos!\n${this.usage}`);

        return;
      }

      const [, amountOfAerials] = args;

      const occurrences = await Prociv.filterByMinimumAerials(amountOfAerials);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}`;

        if (isSevere(occurrence)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'important') {
      const occurrences = await Fires.getImportantForestFires();

      occurrences.forEach((occurrence) => {
        const {
          id,
          l: city,
          s: local,
          i, ps,
        } = occurrence;

        events.push(`__**${id} - #IF${city}, #${local} - ${i} ${ps ? `- ${ps}` : ''}**__`);
      });
    }

    sendMessages();
  },
};
