const { WeatherApi } = require('../api');

module.exports = {
  name: 'weather',
  description: 'Weather!',
  execute(message, args) {
    let day = 0;

    if (args.length >= 0) {
      const requestedDay = args[0].toLowerCase();

      if (requestedDay === 'tomorrow') {
        day = 1;
      }
    }

    const rowsPerMessage = 15;
    let events = ['***Meteorologia:***'];
    let count = 0;

    WeatherApi.getByDay(day).then((response) => {
      if (response.data.length === 0) {
        try {
          message.channel.send('***Sem Dados***');
        } catch (e) {
          //
        }

        return;
      }

      response.data.forEach((element) => {
        const {
          local,
          tMin: minTemperature,
          tMax: maxTemperature,
          descIdWeatherTypePT,
          precipitaProb: rainOdds,
          vento: wind,
          predWindDir: windDirectionPrediction,
        } = element;

        count += 1;
        events.push(`
          **${local}** :thermometer:${minTemperature} -${maxTemperature}ºC / ${descIdWeatherTypePT} / :umbrella: ${rainOdds}% / :dash: ${wind} ${windDirectionPrediction}
        `);

        if (count >= rowsPerMessage) {
          try {
            message.channel.send(events.join(''));
          } finally {
            count = 0;
            events = [];
          }
        }
      });

      try {
        message.channel.send(events.join(''));
      } catch (e) {
        //
      }
    });
  },
};
