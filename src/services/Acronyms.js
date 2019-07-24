const { AcronymsApi } = require('../api');

/**
 *
 * @param {String} acronym
 * @returns {Array}
 */
const getExactAcronym = async (acronym) => {
  const { data } = await AcronymsApi.get(acronym);

  return data;
};

module.exports = {
  getExactAcronym,
};
