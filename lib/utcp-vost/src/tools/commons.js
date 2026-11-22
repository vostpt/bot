const moment = require('moment-timezone');

const { NO_HISTORY, unavailableResult, ZONE } = require('./context');

const positional = (names, args) => {
  const values = Array.isArray(args) ? args : [args];

  if (values.length === 1 && values[0] && typeof values[0] === 'object' && !Array.isArray(values[0])) {
    return { ...values[0] };
  }

  return names.reduce((acc, name, index) => {
    if (values[index] !== undefined) {
      acc[name] = values[index];
    }

    return acc;
  }, {});
};

const rangeFrom = (args) => ({
  start: args.start || '',
  end: args.end || '',
  date: args.date || '',
});

const noHistory = (source, args) => (
  unavailableResult(source, NO_HISTORY, { requested: rangeFrom(args) })
);

const toPortugueseDate = (value) => {
  const parsed = moment(value);

  return parsed.isValid() ? parsed.tz(ZONE).format('DD/MM/YYYY') : String(value || '');
};

module.exports = {
  positional,
  rangeFrom,
  noHistory,
  toPortugueseDate,
};
