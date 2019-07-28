const {
  Prociv,
} = require('../services');
const { cooldown } = require('../../config/bot');

module.exports = {
  active: true,
  args: true,
  cooldown,
  name: 'stats',
  usage: `
    **!stats** - *Mostra o número total de meios envolvidos nas ocorrências, descriminado por estado.*
  `,

  /**
  * Send to Discord stats about total number of means
  *
  * @async
  * @param {Message} message
  * @param {Array} args
  */
  async execute(message, args) {
    if (this.args && args.length === 0) {
      const occurrences = await Prociv.getAll();
      const counters = {};
      let totalCounters = [0, 0, 0, 0];

      occurrences.forEach((element) => {
        const {
          o: operatives,
          t: vehicles,
          a: aircrafts,
          ide: statusId,
        } = element;

        const elementValues = [1, operatives, vehicles, aircrafts];

        totalCounters = totalCounters.map((val, index) => val + elementValues[index]);

        if (!(statusId in counters)) {
          counters[statusId] = elementValues;
        } else {
          counters[statusId] = counters[statusId].map((val, index) => val + elementValues[index]);
        }
      });

      message.channel.send(`:fire: ***Situação operacional nacional:***\nValores totais: ${totalCounters[0]} :fire: | ${totalCounters[1]} :man_with_gua_pi_mao: | ${totalCounters[2]} :fire_engine: | ${totalCounters[3]} :helicopter:`);

      Object.keys(counters).forEach((statusId) => {
        message.channel.send(`Estado ${Prociv.statusIdToDesc[statusId]}: ${counters[statusId][0]} :fire: | ${counters[statusId][1]} :man_with_gua_pi_mao: | ${counters[statusId][2]} :fire_engine: | ${counters[statusId][3]} :helicopter:`);
      });
    }
  },
};
