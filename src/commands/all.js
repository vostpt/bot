const { FireApi, ProcivApi } = require('../api');

module.exports = {
  name: 'all',
  description: 'all',
  execute(message, args) {
    if (args.length === 0) {
      ProcivApi.getAll().then((response) => {
        const events = [];
        const importantEvents = [];

        if (response.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
        }

        response.data.forEach((element) => {
          const {
            id,
            d: date,
            l: city,
            s: local,
            o: mans,
            t: cars,
            a: helicopters,
            e: status,
          } = element;

          const isSevere = mans > 20 || cars + helicopters > 5;

          if (isSevere) {
            importantEvents.push(`
              __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
            `);
          } else {
            events.push(`
              ${date} - ${id} - $IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}
            `);
          }
        });

        if (importantEvents.length > 0) {
          message.channel.send(
            `:fire::fire: ***Ocorrências Importantes:***
            ${importantEvents.join('')}`,
          );
        }

        if (events.length > 0) {
          message.channel.send(
            `:fire: ***Ocorrências:***
            ${events.join('')}
          `,
          );
        }
      });

      return;
    }

    const argumento = args[0].toLowerCase();

    if (argumento === 'links') {
      ProcivApi.getAll().then((res) => {
        const events = [];
        const importantEvents = [];

        if (res.data.length === 0) {
          try {
            message.channel.send(':fire: ***Sem Ocorrências***');
          } catch (e) {
            //
          }
        }

        res.data.forEach((element) => {
          const {
            id,
            l: city,
            s: local,
            o: mans,
            t: cars,
            a: helicopters,
          } = element;

          const isSevere = mans > 20 || cars + helicopters > 5;

          if (isSevere) {
            importantEvents.push(`
              __**#IF${city},${local} - https://fogos.pt/fogo/2019${id}**__
              `);
          } else {
            events.push(`
              #IF${city},${local} - https://fogos.pt/fogo/2019${id}
              `);
          }
        });

        if (events.length > 0 || importantEvents.length > 0) {
          try {
            message.channel.send(
              `:fire: ***Ocorrências:***
                ${importantEvents.join('')}
                ${events.join('')}
            `,
            );
          } catch (e) {
            //
          }
        } else {
          try {
            message.channel.send(':fire: ***Sem Ocorrências***');
          } catch (e) {
            //
          }
        }
      });
    }

    if (argumento === 'human') {
      if (args.length < 2) {
        message.channel.send(
          `Falta o numero de operacionais, ${message.author}!`,
        );

        return;
      }

      const [, amountOfMans] = args;

      ProcivApi.getAll().then((res) => {
        const events = [];
        const importantEvents = [];

        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');

          return;
        }

        res.data.forEach((element) => {
          const {
            id,
            d: date,
            l: city,
            s: local,
            o: mans,
            t: cars,
            a: helicopters,
            e: status,
          } = element;

          if (amountOfMans <= mans) {
            return;
          }

          const isSevere = mans > 20 || cars + helicopters > 5;

          if (isSevere) {
            importantEvents.push(`
              __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
            `);
          } else {
            events.push(`
              ${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}
            `);
          }
        });

        if (events.length > 0 || importantEvents.length > 0) {
          message.channel.send(
            `:fire: ***Ocorrências +${amountOfMans} Operacionais:***
              ${importantEvents.join('')}
              ${events.join('')}
            `,
          );
        }
      });

      return;
    }

    if (argumento === 'ground') {
      if (args.length < 2) {
        message.reply(`Falta o numero de meios terrestres!`);
      }

      const [, amountOfCars] = args;

      ProcivApi.getAll().then((res) => {
        const events = [];
        const importantEvents = [];

        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        res.data.forEach((element) => {
          const {
            id,
            d: date,
            l: city,
            s: local,
            o: mans,
            t: cars,
            a: helicopters,
            e: status,
          } = element;

          if (amountOfCars <= cars) {
            return;
          }

          const isSevere = mans > 20 || cars + helicopters > 5;
          if (isSevere) {
            importantEvents.push(`
              __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
            `);
          } else {
            events.push(`
              ${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}
            `);
          }
        });

        if (events.length > 0 || importantEvents.length > 0) {
          message.channel.send(
            `:fire: ***Ocorrências +${amountOfCars} Meios Terrestres:***
              ${importantEvents.join('')}
              ${events.join('')}
            `,
          );
        }
      });

      return;
    }

    if (argumento === 'air') {
      if (args.length < 2) {
        message.channel.send(
          `Falta o numero de meios aéreos, ${message.author}!`,
        );
      }

      const [, amountOfAerials] = args;

      ProcivApi.getAll().then((res) => {
        const events = [];
        const importantEvents = [];

        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        res.data.forEach((element) => {
          const {
            id,
            d: date,
            l: city,
            s: local,
            o: mans,
            t: cars,
            a: helicopters,
            e: status,
          } = element;

          if (amountOfAerials <= helicopters) {
            return;
          }

          const isSevere = mans > 20 || cars + helicopters > 5;
          if (isSevere) {
            importantEvents.push(`
              __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}**__
            `);
          } else {
            events.push(`
              ${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter:${status}
            `);
          }
        });

        if (events.length > 0 || importantEvents.length > 0) {
          message.channel.send(
            `:fire: ***Ocorrências +${amountOfAerials} Meios Aéreos:***
              ${importantEvents.join('')}
              ${events.join('')}
            `,
          );
        }
      });

      return;
    }

    if (argumento === 'important') {
      FireApi.getImportantIF().then((res) => {
        const events = [];

        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        res.data.forEach((element) => {
          const { id, l: city, s: local, i, ps } = element;

          events.push(`
            __**${id} - #IF${city},${local} - ${i} $${ps ? `- ${ps}` : ''}**__
          `);
        });

        if (events.length > 0) {
          message.channel.send(
            `:fire: ***Ocorrências:***
            ${events.join('')}
          `,
          );
        }
      });
    }
  },
};
