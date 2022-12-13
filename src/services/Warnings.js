/**
 * TO BE DEPRECATED SOON
 * Warnings' gets a list of updated meteo warnings issued by IPMA,
 * using bot api, and send it to Discord and Twitter
 * Note that will be sent one message including all warnings to Discord,
 * while one message per warning will be sent to Twitter
 */

const { WarningsApi } = require('../api');

/**
 * Returns array of updated meteo warnings
 *
 * @returns {Array} warnings
 */
const getAll = async () => {
  const { data: warnings = [] } = await WarningsApi.getNewWarnings();

  return warnings;
};

module.exports = {
  getAll,
};
