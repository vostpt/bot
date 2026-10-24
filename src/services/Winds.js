const axios = require('axios');

const ENDPOINT =
  'https://api.ipma.pt/open-data/observation/meteorology/stations/observations.json';

const normalize = (v) => {
  if (v === -99 || v === null || v === undefined) return null;
  if (typeof v !== 'number') return null;
  return v;
};

const getAll = async () => {
  const res = await axios.get(ENDPOINT);

  const data = res.data?.data || res.data || {};

  return Object.entries(data)
    .map(([stationId, d]) => {
      if (!d) return null;

      const wind = normalize(d.intensidadeVentoKM);

      if (wind === null) return null;

      return {
        stationId,
        intensidadeVentoKM: wind,
        intensidadeVento: normalize(d.intensidadeVento),
        idDireccVento: normalize(d.idDireccVento),
        temperatura: normalize(d.temperatura),
        humidade: normalize(d.humidade),
      };
    })
    .filter(Boolean);
};

const getWindGlobal = async () => {
  const stations = await getAll();

  if (!stations.length) return null;

  const sorted = stations
    .filter(s => typeof s.intensidadeVentoKM === 'number')
    .sort((a, b) => b.intensidadeVentoKM - a.intensidadeVentoKM);

  const top = sorted.slice(0, 5);

  if (!top.length) return null;

  const avg =
    top.reduce((acc, s) => acc + s.intensidadeVentoKM, 0) / top.length;

  return {
    speed: avg.toFixed(1),
    direction: top[0]?.idDireccVento ?? 'N/A',
    stations: top.length,
  };
};

// Compatibility for the remaining Rally/prefix command loader. New slash
// commands use getWindGlobal instead of the legacy city endpoint.
const getById = async (stationId) => {
  const stations = await getAll();
  const station = stations.find((item) => item.stationId === stationId);
  if (!station) return null;

  return {
    id: station.stationId,
    l: station.stationId,
    s: '',
    velocidade: station.intensidadeVentoKM,
    sentido: station.idDireccVento,
  };
};

module.exports = {
  getAll,
  getById,
  getWindGlobal,
};
