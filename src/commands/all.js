
const {
  Prociv,
  Fire,
} = require('../services');
const { isSevere } = require('../helpers');

module.exports = {
  name: 'all',
  args: true,
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
  async execute(message, args) {
    const events = [];
    const importantEvents = [];

    if (this.args && args.length === 0) {
      const data = await Prociv.getAll();

      if (data.length === 0) {
        message.channel.send(':fire: ***Sem Ocorrências***');

        return;
      }

      data.forEach((item) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = item;

        const msg = `${date} - ${id} - $IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}`;

        if (isSevere(mans, cars + helicopters)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });

      return;
    }

    const requestedArgument = args[0].toLowerCase();

    if (!this.allowedArgs.includes(requestedArgument)) {
      try {
        message.reply(`${requestedArgument} não é válido.\n${this.usage}`);
      } catch (e) {
        //
      }

      return;
    }

    if (requestedArgument === 'links') {
      const data = await Prociv.getAll();

      if (data.length === 0) {
        try {
          message.channel.send(':fire: ***Sem Ocorrências***');
        } catch (e) {
          //
        }

        return;
      }

      data.forEach((item) => {
        const {
          id,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
        } = item;

        const msg = `#IF${city},${local} - https://fogos.pt/fogo/2019${id}`;

        if (isSevere(mans, cars + helicopters)) {
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

      const data = await Prociv.filterByMinimumMans(amountOfMans);

      if (data.length === 0) {
        try {
          message.channel.send(':fire: ***Sem Ocorrências***');
        } catch (e) {
          //
        }

        return;
      }

      data.forEach((item) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = item;

        const msg = `${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}`;

        if (isSevere(mans, cars + helicopters)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });

      return;
    }

    if (requestedArgument === 'ground') {
      if (args.length < 2) {
        try {
          message.reply(`falta o numero de meios terrestres!\n${this.usage}`);
        } catch (e) {
          //
        }

        return;
      }

      const [, amountOfCars] = args;

      const data = await Prociv.filterByMinimumCars(amountOfCars);

      if (data.length === 0) {
        try {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        } catch (e) {
          //
        }

        return;
      }

      data.forEach((item) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = item;

        const msg = `${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}`;

        if (isSevere(mans, cars + helicopters)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'air') {
      if (args.length < 2) {
        try {
          message.reply(`falta o numero de meios aéreos!\n${this.usage}`);
        } catch (e) {
          //
        }

        return;
      }

      const [, amountOfAerials] = args;

      const data = await Prociv.filterByMinimumAerials(amountOfAerials);

      if (data.length === 0) {
        try {
          message.channel.send(':fire: ***Sem Ocorrências***');
        } catch (e) {
          //
        }

        return;
      }

      data.forEach((item) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: mans,
          t: cars,
          a: helicopters,
          e: status,
        } = item;

        const msg = `${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}`;

        if (isSevere(mans, cars + helicopters)) {
          importantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'important') {
      const data = await Fire.getImportantIF();
      if (data.length === 0) {
        try {
          message.channel.send(':fire: ***Sem Ocorrências***');
        } catch (e) {
          //
        }

        return;
      }

      data.forEach((item) => {
        const {
          id,
          l: city,
          s: local,
          i, ps,
        } = item;

        events.push(`__**${id} - #IF${city},${local} - ${i} $${ps ? `- ${ps}` : ''}**__`);
      });
    }

    try {
      if (importantEvents.length > 0) {
        message.channel.send(`:fire::fire: ***Ocorrências Importantes:***\n${importantEvents.join('\n')}`);
        return;
      }

      if (events.length > 0) {
        message.channel.send(`:fire: ***Ocorrências:***\n${events.join('\n')}`);
        return;
      }

      message.channel.send(':fire: ***Sem Ocorrências***');
    } catch (e) {
      //
    }
  },
};
