const moment = require('moment');
const { Earthquakes } = require('../services');
const { cooldown } = require('../../config/bot');
const { sendMessageAnswer, sendMessageToChannel } = require('../services/Discord');

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
      sendMessageAnswer(message, `falta a data.\n${this.usage}`);

      return;
    }

    const [requestedDate] = args;

    const formattedDate = moment(requestedDate, 'DD/MM/AAAA');

    if (!formattedDate.isValid()) {
      sendMessageAnswer(message, `o formato da data é inválido.\n${this.usage}`);

      return;
    }

    const { events, eventsSensed } = await Earthquakes.getByDate(formattedDate);

    const numEvents = events.length;
    const numEventsSensed = eventsSensed.length;

    if (numEvents + numEventsSensed === 0) {
      sendMessageAnswer(message, `Sem dados acerca do dia ${requestedDate}`);

      return;
    }

    if (numEventsSensed > 0) {
      const eventsSensedMsg = eventsSensed.map(event => event.message);

      sendMessageToChannel(message.channel, `***Sismos sentidos dia ${requestedDate}:***\n${eventsSensedMsg.join('\n')}`);
    }

    if (numEvents > 0) {
      sendMessageToChannel(message.channel, `***Sismos de ${requestedDate}:***\n${events.join('\n')}`);
    }
  },
};
