const moment = require('moment-timezone');
const { addFunctionToUtcpDirectCall } = require('@utcp/direct-call');

const {
  limitOf,
  normalizeResult,
  isPastRange,
  asArray,
  parseInLisbon,
} = require('./context');
const { positional, noHistory, toPortugueseDate } = require('./commons');
const { getDirectManual, directGroups } = require('../manuals');

const createVostWrappers = ({ services, apis }) => ({
  'vost_prociv.get_all': async (...args) => {
    const options = positional(['limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('prociv', options);
    }

    const occurrences = await services.Prociv.getAll();
    return normalizeResult('prociv', occurrences, { limit: options.limit });
  },

  'vost_prociv.get_by_id': async (...args) => {
    const options = positional(['id', 'limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('prociv', options);
    }

    const occurrences = await services.Prociv.getById(String(options.id || ''));
    return normalizeResult('prociv', occurrences, { limit: options.limit });
  },

  'vost_prociv.get_by_city': async (...args) => {
    const options = positional(['city', 'limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('prociv', options);
    }

    const search = String(options.city || '').toLowerCase();
    const occurrences = await services.Prociv.getByCityAndLocal(search);
    return normalizeResult('prociv', occurrences, { limit: options.limit });
  },

  'vost_prociv.filter_by_status': async (...args) => {
    const options = positional(['status', 'limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('prociv', options);
    }

    const occurrences = await services.Prociv.filterByStatus(String(options.status || ''));
    return normalizeResult('prociv', occurrences, { limit: options.limit });
  },

  'vost_fires.get_important': async (...args) => {
    const options = positional(['limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('fires', options);
    }

    const fires = await services.Fires.getImportantForestFires();
    return normalizeResult('fires', fires, { limit: options.limit });
  },

  'vost_fires.get_by_district': async (...args) => {
    const options = positional(['district', 'limit', 'start', 'end', 'date'], args);

    if (isPastRange(options)) {
      return noHistory('fires', options);
    }

    const fires = await services.Fires.getByDistrict(String(options.district || ''));
    return normalizeResult('fires', fires, { limit: options.limit });
  },

  'vost_ipma.get_current_warnings': async (...args) => {
    const options = positional(['limit'], args);
    const warnings = await apis.IpmaApi.fetch();

    return normalizeResult('ipma', warnings, { limit: options.limit });
  },

  'vost_meteoalarm.get_current': async (...args) => {
    const options = positional(['country', 'limit'], args);
    const country = String(options.country || 'portugal');
    const allWarnings = await apis.MeteoAlarmApi.fetch();
    const byCountry = allWarnings && allWarnings[country];
    const warnings = byCountry || (country === 'all'
      ? Object.values(allWarnings || {}).flat()
      : []);

    return normalizeResult('meteoalarm', warnings, { limit: options.limit });
  },

  'vost_earthquakes.get_by_date': async (...args) => {
    const options = positional(['date', 'limit'], args);
    const date = toPortugueseDate(options.date);
    const earthquakes = await services.Earthquakes.getByDate(date);

    return normalizeResult('ipma-sismos', earthquakes, { limit: options.limit });
  },

  'vost_weather.get_by_day': async (...args) => {
    const options = positional(['day', 'limit'], args);
    const day = Number(options.day);
    const forecast = await services.Weather.getByDay(Number.isFinite(day) ? day : 0);

    return normalizeResult('ipma', forecast, { limit: options.limit });
  },

  'vost_acronyms.get_exact': async (...args) => {
    const options = positional(['acronym', 'limit'], args);
    const acronyms = await services.Acronyms.getExactAcronym(String(options.acronym || ''));

    return normalizeResult('acronimos-vost', acronyms, { limit: options.limit });
  },

  'vost_sns.get_alerts': async (...args) => {
    const options = positional(['limit'], args);
    const alerts = await services.Sns.getAlerts();

    return normalizeResult('sns24', alerts, { limit: options.limit });
  },

  'vost_corona.get_all': async (...args) => {
    const options = positional(['limit'], args);
    const reports = await services.Corona.getAll();

    return normalizeResult('dgs', reports, { limit: options.limit });
  },

  'vost_corona.get_resume': async (...args) => {
    const options = positional(['date'], args);
    const resume = await services.Corona.getResume(String(options.date || ''));

    return normalizeResult('dgs', asArray(resume));
  },

  'vost_journal.get_recent': async (...args) => {
    const options = positional(['date', 'limit'], args);
    const decrees = await apis.JournalApi.getJournal();
    const limit = limitOf(options.limit);

    const recent = parseInLisbon().subtract(7, 'days').startOf('day');
    const filtered = asArray(decrees).filter((decree) => {
      if (!options.date) {
        return true;
      }

      const published = moment(decree.isoDate || decree.pubDate);
      return published.isValid() && !published.isBefore(recent)
        && published.format('YYYY-MM-DD') === parseInLisbon(options.date).format('YYYY-MM-DD');
    });

    return normalizeResult('dre', filtered, {
      limit,
      note: options.date && isPastRange({ date: options.date })
        ? 'Só estão disponíveis os documentos recentes devolvidos pela fonte atual.'
        : undefined,
    });
  },
});

let registered = false;

const registerVostCallables = ({ services, apis }) => {
  if (registered) {
    return;
  }

  directGroups.forEach((group) => {
    addFunctionToUtcpDirectCall(`${group}.__manual__`, () => getDirectManual(group));
  });

  const wrappers = createVostWrappers({ services, apis });

  Object.entries(wrappers).forEach(([name, fn]) => {
    addFunctionToUtcpDirectCall(name, fn);
  });

  registered = true;
};

const resetRegistered = () => {
  registered = false;
};

module.exports = {
  createVostWrappers,
  registerVostCallables,
  resetRegistered,
};
