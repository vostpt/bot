const allowedArgs = ['hoje'];

module.exports = {
  name: 'rcm',
  description: 'RCM!',
  execute(message, args) {
    if (args.length === 0) {
      message.reply(`
        Falta o dia!
        Dias disponíveis: ${allowedArgs.join(', ')}
      `);
    }

    const [day] = args;

    if (!allowedArgs.includes(day)) {
      message.reply(`Dias disponíveis: ${allowedArgs.join(', ')}`);
    }

    if (day.toLowerCase() === 'hoje') {
      message.channel.send(
        `http://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/FWI24_conc.jpg`,
      );
    }
  },
};
