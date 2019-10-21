const Jobs = require('../jobs');
const { locale } = require('../../config/locale');
const { betaMode } = require('../../config/bot');

/**
* Start bot scheduled jobs
*
* @param {Client} client
*/
const ready = (client) => {
  if (!betaMode) {
    (new Jobs(client)).startProd();
  } else {
    (new Jobs(client)).startBeta();
    // eslint-disable-next-line no-console
    console.log('Beta mode enabled');
  }

  const currentDate = new Date().toLocaleString(locale);

  // eslint-disable-next-line no-console
  console.log(`READY :: Bot started @ ${currentDate}`);
};

module.exports = ready;
