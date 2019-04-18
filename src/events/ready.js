const Jobs = require('../jobs');
const { locale } = require('../../config/locale');

const ready = (client) => {
  new Jobs(client).startAll();

  const currentDate = new Date().toLocaleString(locale);

  // eslint-disable-next-line no-console
  console.log(`READY :: Bot started @ ${currentDate}`);
};

module.exports = ready;
