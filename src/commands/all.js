
const {
  Prociv,
  Fires,
} = require('../services');
const { isSevere } = require('../helpers');
const { cooldown } = require('../../config/bot');

module.exports = {
  active: true,
  allowedArgs: [
    'human',
    'ground',
    'air',
    'important',
    'links',
  ],
  args: true,
  cooldown,
  name: 'all',
  usage: `
    **!all** - *Mostra todas as ocorrências em estado de despacho, em curso ou em resolução.*
    **!all [human|ground|air] [numero_filtrar]** - *Igual ao anterior mas com filtro.*
    **!all links** - *Mostra todas as ocorrências e o link para o fogos.pt em estado de despacho, em curso ou em resolução.*
    **!all important** - *Mostra todas as ocorrências marcadas como importantes na ProCivApi.*
  `,

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
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

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

      const [, amountOfOperatives] = args;

      const occurrences = await Prociv.filterByMinimumOperatives(amountOfOperatives);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

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

      const [, amountOfVehicles] = args;

      const occurrences = await Prociv.filterByMinimumVehicles(amountOfVehicles);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

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

      const [, amountOfAircrafts] = args;

      const occurrences = await Prociv.filterByMinimumAircrafts(amountOfAircrafts);

      occurrences.forEach((occurrence) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = occurrence;

        const msg = `${date} - ${id} - #IF${city}, #${local} - ${operatives}:man_with_gua_pi_mao: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

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
