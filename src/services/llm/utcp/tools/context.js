const moment = require('moment-timezone');

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;
const ZONE = 'Europe/Lisbon';
const NO_HISTORY = 'sem dados históricos';

const limitOf = (value) => {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_LIMIT;
  }

  return Math.min(Math.floor(parsed), MAX_LIMIT);
};

const asArray = (value) => {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === undefined || value === null || value === '') {
    return [];
  }

  return [value];
};

const limitData = (data, value) => asArray(data).slice(0, limitOf(value));

const normalizeResult = (source, data, { limit, ...extra } = {}) => ({
  source,
  retrievedAt: new Date().toISOString(),
  available: true,
  data: limitData(data, limit),
  ...extra,
});

const unavailableResult = (source, reason = NO_HISTORY, extra = {}) => ({
  source,
  retrievedAt: new Date().toISOString(),
  available: false,
  reason,
  data: [],
  ...extra,
});

const parseInLisbon = (value) => {
  const text = String(value || '');

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
    return moment.tz(text, 'DD/MM/YYYY', ZONE);
  }

  if (/^\d{8}$/.test(text)) {
    return moment.tz(text, 'DDMMYYYY', ZONE);
  }

  return moment.tz(text, ZONE);
};

const isPastRange = (range, now = new Date()) => {
  if (!range || typeof range !== 'object') {
    return false;
  }

  const today = moment(now).tz(ZONE).startOf('day');
  const boundaries = [range.start, range.end || range.start, range.date]
    .filter(Boolean)
    .map(parseInLisbon)
    .filter((parsed) => parsed.isValid());

  if (boundaries.length === 0) {
    return false;
  }

  return boundaries.some((parsed) => parsed.isBefore(today));
};

const isPastDate = (date, now = new Date()) => isPastRange({ date }, now);

module.exports = {
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ZONE,
  NO_HISTORY,
  limitOf,
  asArray,
  limitData,
  normalizeResult,
  unavailableResult,
  isPastRange,
  isPastDate,
  parseInLisbon,
};
