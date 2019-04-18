const { ProcivApi } = require('../api');

const statuses = {
  despacho: '4',
  curso: '5',
  resolução: '7',
  conclusão: '8',
  vigilância: '9',
};

const getAll = async () => {
  const { data = [] } = await ProcivApi.getAll();

  return data;
};

const getById = async (requestedId) => {
  const events = await getAll();

  return events.filter(({ id }) => id === requestedId);
};

const getByCity = async (cityId) => {
  const events = await getAll();

  return events.filter(({ l: city }) => `#IF${city}` === cityId);
};

const filterByMinimumMans = async (amountOfMansInvolved) => {
  if (amountOfMansInvolved < 0) {
    return Promise.reject();
  }

  const events = await getAll();

  return events.filter(({ o: mans }) => mans > amountOfMansInvolved);
};

const filterByMinimumCars = async (amountOfCarsInvolved) => {
  if (amountOfCarsInvolved < 0) {
    return Promise.reject();
  }
  const events = await getAll();

  return events.filter(({ t: cars }) => cars > amountOfCarsInvolved);
};

const filterByMinimumAerials = async (amountOfAerialsInvolved) => {
  if (amountOfAerialsInvolved < 0) {
    return Promise.reject();
  }
  const events = await getAll();

  return events.filter(({ h: aerials }) => aerials > amountOfAerialsInvolved);
};

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
