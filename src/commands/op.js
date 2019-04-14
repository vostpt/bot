const { FireApi, WindApi, ProcivApi } = require('../api');

module.exports = {
  name: 'op',
  description: 'Op',
  async execute(message, args) {
    if (args.length === 0) {
      message.reply(`Falta o numero da ocorrência!`);
      return;
    }

    const argumento = args[0].toLowerCase();
    if (argumento === 'id') {
      const [, requestedId] = args;
      ProcivApi.getAll().then((res) => {
        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        const events = [];
        const importantEvents = [];

        res.data.forEach((element) => {
          if (element.id === requestedId) {
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
          }
        });

        if (events.length > 0 || importantEvents.length > 0)
          message.channel.send(`
            :fire: ***Ocorrências:***
            ${importantEvents.join('')}
            ${events.join('')}
          `);
      });
    }

    if (argumento === 'if') {
      const [, requestedCity] = args;

      ProcivApi.getAll().then((response) => {
        if (response.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');

          return;
        }

        const events = [];
        const importantEvents = [];

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

          if (`#IF${city}` === requestedCity) {
            const isSevere = mans > 20 || cars + helicopters > 5;

            if (isSevere) {
              importantEvents.push(`
                __**${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}**__
              `);
            } else {
              events.push(`
                ${date} - ${id} - #IF${city},${local} - ${mans}:man_with_gua_pi_mao: ${cars}:fire_engine: ${helicopters}:helicopter: - ${status}
              `);
            }
          }
        });

        if (events.length > 0 || importantEvents.length > 0)
          message.channel.send(`
            :fire: ***Ocorrências:***
            ${importantEvents.join('')}
            ${events.join('')}
          `);
      });
    }

    if (argumento === 'vento') {
      if (args.length === 1) {
        message.reply('Falta argumentos');
        return;
      }

      const cityId = args[1].toLowerCase();

      WindApi.getById(cityId).then((res) => {
        if (res.data.length === 0) {
          message.channel.send(':wind_blowing_face: :fire: ***Sem Ocorrência***');
          return;
        }

        const { id, l: city, s: local, velocidade: speed, sentido: direction } = res.data;

        message.channel.send(`
          :wind_blowing_face: :fire: ***Ocorrência:***
          ${id} - #IF${city},${local} - ${speed} KM/H ${direction}
        `);
      });
    }

    if (argumento === 'status') {
      const statuses = {
        despacho: '4',
        curso: '5',
        resolução: '7',
        conclusão: '8',
        vigilância: '9',
      };

      const [, requestedStatus] = args;

      ProcivApi.getAll().then((res) => {
        if (res.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        const events = [];
        const importantEvents = [];

        res.data.forEach((element) => {
          const {
            id,
            d: date,
            o: mans,
            t: cars,
            a: helicopters,
            ide: statusId,
            l: city,
            s: local,
            e: status,
          } = element;

          if (statusId === statuses[requestedStatus.toLowerCase()]) {
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
          }
        });

        if (events.length > 0 || importantEvents.length > 0) {
          message.channel.send(`
            :fire: ***Ocorrências:***
            ${importantEvents.join('')}
            ${events.join('')}
          `);
        } else {
          message.channel.send(':fire: ***Sem Ocorrências***');
        }
      });
    }

    if (argumento === 'distrito') {
      const [, district] = args;

      const districts = {
        aveiro: '1',
        beja: '2',
        braga: '3',
        bragança: '4',
        castelobranco: '5',
        coimbra: '6',
        évora: '7',
        faro: '9',
        guarda: '10',
        leiria: '11',
        lisboa: '12',
        portalegre: '13',
        porto: '14',
        santarém: '15',
        santarem: '15',
        setúbal: '16',
        setubal: '16',
        vianadocastelo: '17',
        vilareal: '18',
        viseu: '19',
      };

      const districtToSearch = districts[district.toLowerCase()];

      FireApi.getByDistrict(districtToSearch).then((response) => {
        if (response.data.length === 0) {
          message.channel.send(':fire: ***Sem Ocorrências***');
          return;
        }

        const events = [];
        const importantEvents = [];

        response.data.forEach((element) => {
          const { id, d: date, o: mans, t: cars, a: helicopters, l: city, s: local, e: status } = element;

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

        if (events.length > 0 || importantEvents.length > 0) {
          message.channel.send(`
            :fire: ***Ocorrências:***
            ${importantEvents.join('')}
            ${events.join('')}
          `);
        }
      });
    }
  },
};
