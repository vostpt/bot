const moment = require('moment');
const { Earthquakes } = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  active: true,
  args: true,
  cooldown,
  name: 'sismos',
  usage: `
    **!sismos [data]** - Retorna informação acerca de sismos ocorridos na data específicada: Formato da data: dd/mm/aaaa
  `,

  /**
  * Send to Discord all registered earthquakes in a specified date
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      message.reply(`falta a data.\n${this.usage}`);

      return;
    }

    const events = [];
    const eventsSensed = [];

    const [requestedDate] = args;

    const earthquakes = await Earthquakes.getByDate(requestedDate);

    if (earthquakes.length === 0) {
      message.reply(`Sem dados acerca do dia ${requestedDate}`);

      return;
    }

    earthquakes.forEach((element) => {
      const {
        sensed,
        time,
        magType,
        magnitud,
        depth,
        local,
        degree,
        shakemapref,
        lat,
        lon,
        obsRegion,
      } = element;

      const formattedTime = moment(time).format('LT');

      if (sensed) {
        eventsSensed.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. **Sentido em ${local} com Int. ${degree}** ${shakemapref} // ${lat},${lon}`);
      } else {
        events.push(`${formattedTime}h - M${magType} **${magnitud}** em ${obsRegion} a ${depth}Km prof. // ${lat},${lon}`);
      }
    });

    if (eventsSensed.length > 0) {
      message.channel.send(`***Sismos sentidos dia ${requestedDate}:***\n${eventsSensed.join('\n')}`);
    }

    if (events.length > 0) {
      message.channel.send(`***Sismos de ${requestedDate}:***\n${events.join('\n')}`);
    }
  },
};
