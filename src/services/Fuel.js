const { FuelApi } = require('../api');

/**
 * Get updated petrol station fuel stats
 *
 * @param {Client} client
 */
const getFuelStats = async () => {
  const { data } = await FuelApi.get();

  return data;
};

module.exports = {
  getFuelStats,
};
