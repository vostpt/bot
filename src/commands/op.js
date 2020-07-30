const {
  Fires,
  Winds,
  Prociv,
} = require('../services');
const { isSevere, removeAccent } = require('../helpers');
const { cooldown } = require('../../config/bot');

const DISTRICTS = {
  aveiro: '1',
  beja: '2',
  braga: '3',
  bragança: '4',
  castelobranco: '5',
  coimbra: '6',
  evora: '7',
  faro: '9',
  guarda: '10',
  leiria: '11',
  lisboa: '12',
  portalegre: '13',
  porto: '14',
  santarem: '15',
  setubal: '16',
  vianadocastelo: '17',
  vilareal: '18',
  viseu: '19',
};

module.exports = {
  active: true,
  allowedArgs: [
    'id',
    'ir',
    'if',
    'status',
    'distrito',
    'vento',
  ],
  args: true,
  cooldown,
  name: 'op',
  usage: `
    **!op id [numero_id]** - *Mostra os dados relativos à ocorrência com esse id.*
    **!op ir [termo_pesquisa]** - *Mostra os dados relativos às ocorrências num dado concelho/localidade (min. 3 caracteres).*
    **!op ir vento [cidade]** - *Mostra os dados relativos ao vento no local escolhido.*
    **!op status [Despacho|Despacho1Alerta|ChegadaTO|Curso|Resolução|Conclusão|Vigilância]** - *Mostra as ocorrências com o estado indicado.*
    **!op distrito [nome_distrito]** - *Mostra as ocorrências no distrito indicado.*

    Distritos reconhecíveis: *${Object.keys(DISTRICTS).join(', ')}*
  `,

  /**
  * Send to Discord occurrences, filtered by id, county, town, status or district
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply(`falta o parâmetro de filtro das ocorrências!\n${this.usage}`);

      return;
    }

    const events = [];
    const relevantEvents = [];

    const requestedArgument = args[0].toLowerCase();

    if (requestedArgument === 'id') {
      const [, requestedId] = args;

      if (!requestedId) {
        message.reply(`falta o id da ocorrência!\n${this.usage}`);

        return;
      }

      const data = await Prociv.getById(requestedId);

      if (data.length === 0) {
        message.channel.send(':fire: ***Sem Ocorrências***');

        return;
      }

      data.forEach((element) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = element;

        const msg = `${date} - ${id} - #IR${city}, #${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

        if (isSevere(element)) {
          relevantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'ir' || requestedArgument === 'if') {
      const [, requestedCity] = args;

      if (!requestedCity) {
        message.reply(this.usage);

        return;
      }

      const reqCityFormatted = removeAccent(requestedCity.toLowerCase()).replace('#ir', '');

      if (reqCityFormatted.length < 3) {
        message.reply('o nº mínimo de caracteres para pesquisa são 3 (sem espaços). Tenta outra vez\n');

        return;
      }

      const data = await Prociv.getByCityAndLocal(reqCityFormatted);

      if (data.length === 0) {
        message.channel.send(':fire: ***Sem Ocorrências***');

        return;
      }

      data.forEach((element) => {
        const {
          id,
          d: date,
          l: city,
          s: local,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          e: status,
        } = element;

        const msg = `${date} - ${id} - #IR${city}, #${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

        if (isSevere(element)) {
          relevantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'vento') {
      if (this.args && args.length < 2) {
        message.reply(`falta o id da cidade.\n${this.usage}`);

        return;
      }

      const cityId = args[1].toLowerCase();

      const data = await Winds.getById(cityId);

      if (!data) {
        message.channel.send(':wind_blowing_face: :fire: ***Sem Ocorrência***');

        return;
      }

      const {
        id,
        l: city,
        s: local,
        velocidade: speed,
        sentido: direction,
      } = data;

      message.channel.send(`:wind_blowing_face: :fire: ***Ocorrência:***\n${id} - #IR${city},${local} - ${speed} KM/H ${direction}`);
    }

    if (requestedArgument === 'status') {
      const [, requestedStatus] = args;

      if (!requestedStatus) {
        message.reply(this.usage);
        return;
      }

      const reqStatusFormatted = removeAccent(requestedStatus.toLowerCase());

      const data = await Prociv.filterByStatus(reqStatusFormatted);
      if (data.length === 0) {
        message.channel.send(':fire: ***Sem Ocorrências***');

        return;
      }

      data.forEach((element) => {
        const {
          id,
          d: date,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          l: city,
          s: local,
          e: status,
        } = element;

        const msg = `${date} - ${id} - #IR${city}, #${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

        if (isSevere(element)) {
          relevantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (requestedArgument === 'distrito') {
      const [, district] = args;

      if (!district) {
        message.reply(`é necessário fornecer um distrito.\n\nDistritos reconhecíveis:\n${Object.keys(DISTRICTS).join(', ')}`);

        return;
      }

      const districtToSearch = DISTRICTS[district.toLowerCase()];

      if (!districtToSearch) {
        message.reply(`não foi possível identificar esse distrito.\n\nDistritos reconhecíveis:\n${Object.keys(DISTRICTS).join(', ')}`);

        return;
      }

      const fires = await Fires.getByDistrict(districtToSearch);

      if (fires.length === 0) {
        message.channel.send(':fire: ***Sem Ocorrências***');

        return;
      }

      fires.forEach((fire) => {
        const {
          id,
          d: date,
          o: operatives,
          t: vehicles,
          a: aircrafts,
          l: city,
          s: local,
          e: status,
        } = fire;

        const msg = `${date} - ${id} - #IR${city},${local} - ${operatives}:man_firefighter: ${vehicles}:fire_engine: ${aircrafts}:helicopter: - ${status}`;

        if (isSevere(fire)) {
          relevantEvents.push(`__**${msg}**__`);
        } else {
          events.push(msg);
        }
      });
    }

    if (relevantEvents.length > 0) {
      message.channel.send(`:fire: ***Ocorrências relevantes:***\n${relevantEvents.join('\n')}`);
    }

    if (events.length > 0) {
      message.channel.send(`:fire: ***Ocorrências:***\n${events.join('\n')}`);
    }
  },
};
