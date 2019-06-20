const { Weather } = require('../services');

const rowsPerMessage = 15;

module.exports = {
  name: 'weather',
  args: true,
  cooldown: 10,
  description: '',
  usage: `
    **!weather** - *Mostra a meteorologia do dia atual.*
    **!weather tomorrow** - *Mostra a meteorologia do dia seguinte.*
  `,

  /**
  * Send to Discord weather forecast for today or tomorrow
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    let day = 0;

    if (args.length > 0) {
      const requestedDay = args[0].toLowerCase();

      if (requestedDay === 'tomorrow') {
        day = 1;
      } else {
        try {
          message.reply(`desconheço essa opção.${this.usage}`);
        } catch (e) {
          //
        }
        return;
      }
    }

    let events = ['***Meteorologia:*** '];
    let count = 0;
    let chunk = 1;

    const data = await Weather.getByDay(day);

    if (data.length === 0) {
      try {
        message.channel.send('***Sem Dados***');
      } catch (e) {
        //
      }

      return;
    }

    events.push(`[${chunk}/${Math.ceil(data.length / rowsPerMessage)}]`);

    data.forEach((element) => {
      const {
        local,
        tMin: minTemperature,
        tMax: maxTemperature,
        descIdWeatherTypePT,
        precipitaProb: rainOdds,
        vento: wind,
        predWindDir: windDirectionPrediction,
      } = element;

      const msg = `**${local}** :thermometer:${minTemperature} -${maxTemperature}ºC / ${descIdWeatherTypePT} / :umbrella: ${rainOdds}% / :dash: ${wind} ${windDirectionPrediction}`;

      events.push(msg);

      if (count >= rowsPerMessage) {
        try {
          message.channel.send(events.join('\n'));
        } finally {
          count = 0;
          chunk += 1;

          events = [`[${chunk}/${Math.ceil(data.length / rowsPerMessage)}]`];
        }
      }

      count += 1;
    });

    try {
      message.channel.send(events.join('\n'));
    } catch (e) {
      //
    }
  },
};
