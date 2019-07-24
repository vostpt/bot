const { removeAccent } = require('../helpers');
const { ProcivApi } = require('../api');

const statusAbrevToId = {
  despacho: 3,
  despacho1alerta: 4,
  curso: 5,
  chegadato: 6,
  resolucao: 7,
  conclusao: 8,
  vigilancia: 9,
};

const statusIdToDesc = {
  3: 'Despacho',
  4: 'Despacho de 1º alerta',
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
    const foundCity = removeAccent(city.toLowerCase()).includes(searchId);
    const foundLocal = removeAccent(local.toLowerCase()).includes(searchId);

    if (foundCity || foundLocal) {
      return true;
    }

    return false;
  });
};

/**
 * Get occurrences that have more than a given number of operatives
 *
 * @param {Number} amountOfOperativesInvolved
 * @returns {Promise}
 */
const filterByMinimumOperatives = async (amountOfOperativesInvolved) => {
  const amountOfOperatives = Number(amountOfOperativesInvolved);

  if (Number.isNaN(amountOfOperatives) || amountOfOperatives < 0) {
    return Promise.reject();
  }

  const events = await getAll();

  return Promise.resolve(events.filter(({ o: operatives }) => operatives > amountOfOperatives));
};

/**
 * Get occurrences that have more than a given number of ground assets
 *
 * @param {Number} amountOfVehiclesInvolved
 * @returns {Promise}
 */
const filterByMinimumVehicles = async (amountOfVehiclesInvolved) => {
  const amountOfVehicles = Number(amountOfVehiclesInvolved);
  if (Number.isNaN(amountOfVehicles) || amountOfVehicles < 0) {
    return Promise.reject();
  }

  const events = await getAll();

  return Promise.resolve(events.filter(({ t: vehicles }) => vehicles > amountOfVehicles));
};

/**
 * Get occurrences that have more than a given number of aerial assets
 *
 * @param {Number} amountOfAircraftsInvolved
 * @returns {Promise}
 */
const filterByMinimumAircrafts = async (amountOfAircraftsInvolved) => {
  const amountOfAircrafts = Number(amountOfAircraftsInvolved);
  if (Number.isNaN(amountOfAircrafts) || amountOfAircrafts < 0) {
    return Promise.reject();
  }

  const events = await getAll();

  return Promise.resolve(events.filter(({ h: aircrafts }) => aircrafts > amountOfAircrafts));
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
  filterByMinimumOperatives,
  filterByMinimumVehicles,
  filterByMinimumAircrafts,
  filterByStatus,
  filterByStatusId,
  statusAbrevToId,
  statusIdToDesc,
};
