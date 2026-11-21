const moment = require('moment-timezone');

const ZONE = 'Europe/Lisbon';
const SCHEDULE_FLAGS = ['now', 'in', 'at', 'rrule', 'cron'];
const VALUE_FLAGS = ['name', 'prompt', 'in', 'at', 'rrule', 'cron'];
const BOOLEAN_FLAGS = ['now', 'once'];
const KNOWN_FLAGS = [...VALUE_FLAGS, ...BOOLEAN_FLAGS];

const REFERENCES = [
  'Referências: RRULE https://jkbrzt.github.io/rrule/',
  'Cron https://crontab.guru/',
].join(' · ');

const DURATION_UNITS = {
  s: 1000,
  m: 60 * 1000,
  h: 60 * 60 * 1000,
  d: 24 * 60 * 60 * 1000,
};

const AT_FORMATS = ['YYYY-MM-DDTHH:mm', 'YYYY-MM-DDTHH:mm:ss', 'YYYY-MM-DD'];
const FREQUENCIES = ['SECONDLY', 'MINUTELY', 'HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'];
const RULE_KEYS = [
  'FREQ', 'INTERVAL', 'COUNT', 'UNTIL', 'WKST',
  'BYSECOND', 'BYMINUTE', 'BYHOUR', 'BYDAY', 'BYMONTHDAY',
  'BYYEARDAY', 'BYWEEKNO', 'BYMONTH', 'BYSETPOS',
];
const NUMERIC_KEYS = [
  'INTERVAL', 'COUNT', 'BYSECOND', 'BYMINUTE', 'BYHOUR',
  'BYMONTHDAY', 'BYYEARDAY', 'BYWEEKNO', 'BYMONTH', 'BYSETPOS',
];

const USAGE = [
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --now',
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --in "30m"',
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --at "2026-12-25T10:00"',
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --rrule "FREQ=DAILY;BYHOUR=13;BYMINUTE=0"',
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --cron "0 13 * * *"',
  '!agent create --name "Fogos" --prompt "Que fogos houve hoje?" --cron "0 10 * * MON,THU" --once',
  '!agent list',
  '!agent update --name "Fogos" --prompt "Nova pergunta" [--now|--in "30m"|--at "2026-12-25T10:00"|--rrule "..."|--cron "0 13 * * *"]',
  '!agent cancel --name "Fogos"',
  '!agent delete --name "Fogos"',
  '!agents',
  '!agent --help',
  REFERENCES,
].join('\n');

class AgentInputError extends Error {
  constructor(message) {
    super(`${message}\n\n${USAGE}`);
    this.name = 'AgentInputError';
  }
}

const asTokens = (args) => {
  if (args === undefined || args === null) {
    return [];
  }

  if (typeof args === 'string') {
    return args.split(/\s+/).filter(Boolean);
  }

  if (Array.isArray(args)) {
    return args
      .filter(token => token !== undefined && token !== null)
      .map(String)
      .filter(Boolean);
  }

  throw new AgentInputError('Os argumentos têm de ser uma lista de opções');
};

const rejoinQuoted = (tokens) => {
  const joined = [];
  let index = 0;

  while (index < tokens.length) {
    const token = tokens[index];
    const quote = token[0];

    if (quote !== '"' && quote !== "'") {
      joined.push(token);
      index += 1;
      continue;
    }

    let value = token.slice(1);
    index += 1;

    if (value.endsWith(quote)) {
      joined.push(value.slice(0, -1));
      continue;
    }

    let closed = false;
    while (index < tokens.length) {
      const part = tokens[index];
      index += 1;

      if (part.endsWith(quote)) {
        value += ` ${part.slice(0, -1)}`;
        closed = true;
        break;
      }

      value += ` ${part}`;
    }

    if (!closed) {
      throw new AgentInputError('Aspas não fechadas');
    }

    joined.push(value);
  }

  return joined;
};

const parseFlags = (tokens) => {
  const values = rejoinQuoted(asTokens(tokens));
  const flags = {};
  let index = 0;

  while (index < values.length) {
    const token = values[index];

    if (!token.startsWith('--')) {
      index += 1;
      continue;
    }

    const flag = token.slice(2);

    if (!KNOWN_FLAGS.includes(flag)) {
      throw new AgentInputError(`Opção desconhecida: ${token}`);
    }

    if (Object.prototype.hasOwnProperty.call(flags, flag)) {
      throw new AgentInputError(`Opção repetida: ${token}`);
    }

    if (BOOLEAN_FLAGS.includes(flag)) {
      flags[flag] = true;
      index += 1;
      continue;
    }

    const value = values[index + 1];

    if (value === undefined || value.startsWith('--')) {
      throw new AgentInputError(`A opção ${token} requer um valor`);
    }

    flags[flag] = value;
    index += 2;
  }

  return flags;
};

const nowMillis = (opts = {}) => {
  const candidate = typeof opts.now === 'function' ? opts.now() : opts.now;
  const millis = candidate === undefined ? Date.now() : new Date(candidate).getTime();

  if (!Number.isFinite(millis)) {
    throw new AgentInputError('Relógio inválido');
  }

  return millis;
};

const readName = (flags) => {
  const name = String(flags.name === undefined ? '' : flags.name).trim();

  if (!name) {
    throw new AgentInputError('É necessário indicar --name');
  }

  return name;
};

const readPrompt = (flags) => {
  const prompt = String(flags.prompt === undefined ? '' : flags.prompt).trim();

  if (!prompt) {
    throw new AgentInputError('É necessário indicar --prompt');
  }

  return prompt;
};

const parseDuration = (raw) => {
  const match = String(raw).trim().match(/^([1-9]\d*)([smhd])$/i);

  if (!match) {
    throw new AgentInputError(`Duração inválida: ${raw}`);
  }

  return Number(match[1]) * DURATION_UNITS[match[2].toLowerCase()];
};

const parseAt = (raw, millis) => {
  const text = String(raw).trim();
  const hasOffset = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(text);
  const parsed = hasOffset
    ? moment.parseZone(text, true)
    : moment.tz(text, AT_FORMATS, true, ZONE);

  if (!parsed.isValid()) {
    throw new AgentInputError(`Data inválida: ${raw}`);
  }

  const runAt = parsed.toDate();

  if (runAt.getTime() <= millis) {
    throw new AgentInputError(`A data tem de ser futura: ${raw}`);
  }

  return runAt;
};

const parseCron = (raw) => {
  const text = String(raw === undefined ? '' : raw).trim();

  if (!text) {
    throw new AgentInputError('Cron vazio');
  }

  const fields = text.split(/\s+/);

  if (fields.length !== 5) {
    throw new AgentInputError('Cron inválido: use 5 campos (minuto hora dia mês dia-da-semana)');
  }

  try {
    require('cron-parser').parseExpression(text, { tz: ZONE });
  } catch (error) {
    throw new AgentInputError(`Cron inválido: ${raw}`);
  }

  return text;
};

const parseRRule = (raw) => {
  const text = String(raw === undefined ? '' : raw).trim().replace(/^RRULE:/i, '');

  if (!text) {
    throw new AgentInputError('RRULE vazia');
  }

  const seen = new Set();
  const parts = [];

  text.split(';').forEach((entry) => {
    const separator = entry.indexOf('=');

    if (separator < 1) {
      throw new AgentInputError(`RRULE inválida: ${raw}`);
    }

    const key = entry.slice(0, separator).trim().toUpperCase();
    const value = entry.slice(separator + 1).trim().toUpperCase();

    if (!RULE_KEYS.includes(key) || !/^[A-Z0-9,+-]+$/.test(value)) {
      throw new AgentInputError(`RRULE inválida: ${raw}`);
    }

    if (seen.has(key)) {
      throw new AgentInputError(`RRULE repetida: ${key}`);
    }

    seen.add(key);

    if (NUMERIC_KEYS.includes(key) && !/^\d+(?:,\d+)*$/.test(value)) {
      throw new AgentInputError(`RRULE inválida: ${raw}`);
    }

    if ((key === 'COUNT' || key === 'INTERVAL') && !/^[1-9]\d*$/.test(value)) {
      throw new AgentInputError(`RRULE inválida: ${raw}`);
    }

    parts.push(`${key}=${value}`);
  });

  const frequency = parts.find(part => part.startsWith('FREQ='));

  if (!frequency || !FREQUENCIES.includes(frequency.slice(5))) {
    throw new AgentInputError('RRULE requer um FREQ válido');
  }

  return `RRULE:${[frequency, ...parts.filter(part => part !== frequency)].join(';')}`;
};

const buildSchedule = (flags, opts, required) => {
  const present = SCHEDULE_FLAGS.filter(flag => flags[flag] !== undefined);

  if (required && present.length === 0) {
    throw new AgentInputError('É necessário indicar um agendamento: --now, --in, --at, --rrule ou --cron');
  }

  if (present.length > 1) {
    throw new AgentInputError('Indique apenas um agendamento');
  }

  if (present.length === 0) {
    return undefined;
  }

  const kind = present[0];
  const millis = nowMillis(opts);

  if (flags.once && kind !== 'rrule' && kind !== 'cron') {
    throw new AgentInputError('--once só pode ser usado com --rrule ou --cron');
  }

  switch (kind) {
    case 'now':
      return {
        kind,
        runAt: new Date(millis),
      };
    case 'in': {
      const durationMs = parseDuration(flags.in);

      return {
        kind,
        runAt: new Date(millis + durationMs),
        durationMs,
      };
    }
    case 'at':
      return {
        kind,
        runAt: parseAt(flags.at, millis),
      };
    case 'rrule': {
      const rrule = parseRRule(flags.rrule);
      const once = !!flags.once || /(?:^|;)COUNT=1(?:;|$)/.test(rrule);

      return { kind, rrule, once };
    }
    case 'cron':
      return {
        kind,
        cron: parseCron(flags.cron),
        once: !!flags.once,
      };
    default:
      throw new AgentInputError(`Agendamento desconhecido: ${kind}`);
  }
};

const parseCreate = (args = [], opts = {}) => {
  const flags = parseFlags(args);
  const name = readName(flags);
  const prompt = readPrompt(flags);
  const schedule = buildSchedule(flags, opts, true);

  return {
    name,
    nameKey: name.toLowerCase(),
    prompt,
    schedule,
  };
};

const parseUpdate = (args = [], opts = {}) => {
  const flags = parseFlags(args);
  const name = readName(flags);
  const prompt = flags.prompt === undefined ? undefined : readPrompt(flags);
  const schedule = buildSchedule(flags, opts, false);

  if (prompt === undefined && schedule === undefined) {
    throw new AgentInputError('Indique --prompt ou um agendamento para atualizar');
  }

  const result = {
    name,
    nameKey: name.toLowerCase(),
  };

  if (prompt !== undefined) {
    result.prompt = prompt;
  }

  if (schedule !== undefined) {
    result.schedule = schedule;
  }

  return result;
};

const parseCancel = (args = []) => {
  const flags = parseFlags(args);
  const unsupported = Object.keys(flags).find(flag => flag !== 'name');

  if (unsupported !== undefined) {
    throw new AgentInputError(`Opção não permitida em cancel: --${unsupported}`);
  }

  const name = readName(flags);

  return {
    name,
    nameKey: name.toLowerCase(),
  };
};

module.exports = {
  AgentInputError,
  USAGE,
  parseFlags,
  parseCreate,
  parseUpdate,
  parseCancel,
};
