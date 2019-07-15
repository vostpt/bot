const Database = require('../database')
const Jobs = require('../jobs');
const { locale } = require('../../config/locale');

/**
* Start bot scheduled jobs
*
* @param {Client} client
*/
const ready = (client, dbInstance) => {
  (new Jobs(client)).startAll();

  const currentDate = new Date().toLocaleString(locale);

  // eslint-disable-next-line no-console
  console.log(`READY :: Bot started @ ${currentDate}`);
};

module.exports = ready;
