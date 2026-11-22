const { createClient, getClient } = require('./src/client');
const { isAllowed, ALLOWED_TOOLS } = require('./src/allowlist');
const { getDirectManual, getManualCallTemplates, getAllToolNames } = require('./src/manuals');
const {
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
} = require('./src/tools/context');
const { positional, rangeFrom, noHistory, toPortugueseDate } = require('./src/tools/commons');

module.exports = {
  createClient,
  getClient,
  isAllowed,
  ALLOWED_TOOLS,
  getDirectManual,
  getManualCallTemplates,
  getAllToolNames,
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
  positional,
  rangeFrom,
  noHistory,
  toPortugueseDate,
};
