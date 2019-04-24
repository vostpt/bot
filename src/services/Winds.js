const { WindApi } = require('../api');

/**
 *
 * @param {String} cityId
 * @returns {Array}
 */
const getById = async (cityId) => {
  const { winds = [] } = await WindApi.getById(cityId);

  return winds;
};

module.exports = {
  getById,
};
