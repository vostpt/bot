const { Weather } = require('../services');
const { cooldown } = require('../../config/bot');

const rowsPerMessage = 15;

module.exports = {
  active: true,
  args: true,
  cooldown,
  name: 'weather',
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

    if (this.args && args.length > 0) {
      const requestedDay = args[0].toLowerCase();

      if (requestedDay === 'tomorrow') {
        day = 1;
      } else {
        message.reply(`desconheço essa opção.\n${this.usage}`);

        return;
      }
    }

    const data = await Weather.getByDay(day);

    if (data.length === 0) {
      message.channel.send('***Sem Dados***');

      return;
    }

    let chunk = 1;
    let count = 0;
    let events = [
      '***Meteorologia***',
      `[${chunk}/${Math.ceil(data.length / rowsPerMessage)}]`,
    ];

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

    message.channel.send(events.join('\n'));
  },
};
