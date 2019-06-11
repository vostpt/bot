const { ProcivApi } = require('../api');

const statuses = {
  despacho: '4',
  curso: '5',
  resolução: '7',
  conclusão: '8',
  vigilância: '9',
};

/**
 * Get all occurrences
 *
 * @returns {Array} data
 */
const getAll = async () => {
  const { data = [] } = await ProcivApi.getAll();

  return data;
};

/**
 * Get occurrence with a certain id
 *
 * @param {String} requestedId
 * @returns {Array}
 */
const getById = async (requestedId) => {
  const year = (new Date()).getFullYear().toString();

  const events = await getAll();

  const reqIdFormatted = requestedId.startsWith(year) && requestedId.length >= 13
    ? requestedId.slice(4)
    : requestedId;

  return events.filter(({ id }) => id === reqIdFormatted);
};

/**
 * Get occurrences in a certain city
 *
 * @param {String} cityId
 * @returns {Array}
 */
const getByCity = async (cityId) => {
  const events = await getAll();

  return events.filter(({ l: city }) => `#IF${city}` === cityId);
};

/**
 * Get occurrences that have more than a given number of operatives
 *
 * @param {Number} amountOfMansInvolved If < 0 the function will return a rejected Promise object
 * @returns {Promise|Array}
 */
const filterByMinimumMans = async (amountOfMansInvolved) => {
  if (amountOfMansInvolved < 0) {
    return Promise.reject();
  }

  const events = await getAll();

  return events.filter(({ o: mans }) => mans > amountOfMansInvolved);
};

/**
 * Get occurrences that have more than a given number of ground assets
 *
 * @param {Number} amountOfCarsInvolved If < 0 the function will return a rejected Promise object
 * @returns {Promise|Array}
 */
const filterByMinimumCars = async (amountOfCarsInvolved) => {
  if (amountOfCarsInvolved < 0) {
    return Promise.reject();
  }
  const events = await getAll();

  return events.filter(({ t: cars }) => cars > amountOfCarsInvolved);
};

/**
 * Get occurrences that have more than a given number of aerial assets
 *
 * @param {Number} amountOfAerialsInvolved If < 0 the function will return a rejected Promise object
 * @returns {Promise|Array}
 */
const filterByMinimumAerials = async (amountOfAerialsInvolved) => {
  if (amountOfAerialsInvolved < 0) {
    return Promise.reject();
  }
  const events = await getAll();

  return events.filter(({ h: aerials }) => aerials > amountOfAerialsInvolved);
};

/**
 * Get occurrences that have a given status
 *
 * @param {String} requestedStatus
 * @returns {Array}
 */
const filterByStatus = async (requestedStatus) => {
  const events = await getAll();

  return events.filter(({ ide: statusId }) => statusId === statuses[requestedStatus.toLowerCase()]);
};

module.exports = {
  getAll,
  getById,
  getByCity,
  filterByMinimumMans,
  filterByMinimumCars,
  filterByMinimumAerials,
  filterByStatus,
};
