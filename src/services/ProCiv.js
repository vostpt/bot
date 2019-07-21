const { removeAccent } = require('../helpers');

const { ProcivApi } = require('../api');

const statusAbrevToId = {
  despacho1alerta: 3,
  despacho: 4,
  curso: 5,
  chegadato: 6,
  resolucao: 7,
  conclusao: 8,
  vigilancia: 9,
};

const statusIdToDesc = {
  3: 'Despacho de 1º alerta',
  4: 'Despacho',
  5: 'Em Curso',
  6: 'Chegada ao TO',
  7: 'Em Resolução',
  8: 'Em Conclusão',
  9: 'Vigilância',
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
 * Get occurrences in a certain city or local
 *
 * @param {String} searchId
 * @returns {Array}
 */
const getByCityAndLocal = async (searchId) => {
  const events = await getAll();

  return events.filter(({ l: city, s: local }) => {
    if (removeAccent(`${city}`.toLowerCase()).includes(searchId) || removeAccent(`${local}`.toLowerCase()).includes(searchId)) {
      return true;
    }

    return false;
  });
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

  return events.filter(({ ide: statusId }) => statusId === statusAbrevToId[requestedStatus]);
};

/**
 * Get occurrences that have a given status Id
 *
 * @param {String} requestedStatusId
 * @returns {Array}
 */
const filterByStatusId = async (requestedStatusId) => {
  const events = await getAll();

  return events.filter(({ ide: statusId }) => statusId === requestedStatusId);
};

module.exports = {
  getAll,
  getById,
  getByCityAndLocal,
  filterByMinimumMans,
  filterByMinimumCars,
  filterByMinimumAerials,
  filterByStatus,
  filterByStatusId,
  statusAbrevToId,
  statusIdToDesc,
};
