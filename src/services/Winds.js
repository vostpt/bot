const { WindApi } = require('../api');

const getById = async (cityId) => {
  const { winds = [] } = await WindApi.getById(cityId);

  return winds;
};

module.exports = {
  getById,
};
