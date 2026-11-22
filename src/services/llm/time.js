const moment = require('moment-timezone');

const { parseInLisbon, ZONE } = require('./utcp/tools/context');

const UNITS = {
  dia: 'days',
  semana: 'weeks',
  mês: 'months',
  mes: 'months',
};

const unsupported = (reason) => ({
  start: null,
  end: null,
  label: 'data não especificada',
  supported: false,
  reason,
  timezone: ZONE,
});

const iso = (momentValue) => momentValue.tz(ZONE).format('YYYY-MM-DDTHH:mm:ssZ');

const explicitDate = (text) => {
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const ptMatch = text.match(/\b(\d{2}\/\d{2}\/\d{4})\b/);
  const vostMatch = text.match(/\b(\d{8})\b/);
  const found = isoMatch || ptMatch || vostMatch;

  if (!found) {
    return null;
  }

  const date = parseInLisbon(found[1]);

  if (!date.isValid()) {
    return null;
  }

  return { date, label: date.tz(ZONE).format('DD/MM/YYYY') };
};

/**
 * Resolves relative and absolute dates mentioned in a question.
 * All dates are interpreted in Europe/Lisbon.
 *
 * @returns {{start: String, end: String, label: String, supported: Boolean}}
 */
const resolveDateRange = (question, now = new Date()) => {
  const text = String(question || '').toLowerCase();
  const current = moment(now).tz(ZONE);

  if (!text.trim()) {
    return unsupported('Pergunta sem texto');
  }

  const relative = text.match(/\b(?:faz|há|ha)\s+(\d+)\s+(dia|semana|mês|mes)s?\b/i);
  const hasToday = /\b(hoje|agora)\b/.test(text);
  const hasYesterday = /\bontem\b/.test(text);
  const explicit = explicitDate(text);

  const mentions = Number(Boolean(relative || hasToday || hasYesterday)) + Number(Boolean(explicit));

  if (mentions > 1) {
    return unsupported('Várias datas na pergunta; pede esclarecimento.');
  }

  if (relative) {
    const amount = Number(relative[1]);

    if (!Number.isFinite(amount) || amount < 1) {
      return unsupported('Período relativo inválido');
    }

    const rawUnit = relative[2].toLowerCase();
    const unit = UNITS[rawUnit];
    const start = current.clone().subtract(amount, unit);
    const labelUnit = unit === 'months'
      ? (amount > 1 ? 'meses' : 'mês')
      : `${rawUnit}${amount > 1 ? 's' : ''}`;

    return {
      start: iso(start),
      end: iso(current),
      label: `há ${amount} ${labelUnit}`,
      supported: true,
      timezone: ZONE,
    };
  }

  if (hasToday) {
    return {
      start: iso(current.clone().startOf('day')),
      end: iso(current.clone().endOf('day')),
      label: 'hoje',
      supported: true,
      timezone: ZONE,
    };
  }

  if (hasYesterday) {
    return {
      start: iso(current.clone().subtract(1, 'day').startOf('day')),
      end: iso(current.clone().subtract(1, 'day').endOf('day')),
      label: 'ontem',
      supported: true,
      timezone: ZONE,
    };
  }

  if (explicit) {
    return {
      start: iso(explicit.date.clone().startOf('day')),
      end: iso(explicit.date.clone().endOf('day')),
      label: explicit.label,
      supported: true,
      timezone: ZONE,
    };
  }

  return unsupported('Sem data explícita na pergunta');
};

module.exports = {
  resolveDateRange,
  ZONE,
};
