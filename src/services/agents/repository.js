const { db } = require('../../database/models');

const ACTIVE = 'active';
const TIMEZONE = 'Europe/Lisbon';

const plain = (record) => {
  if (!record) {
    return null;
  }

  if (typeof record.get === 'function') {
    return record.get({ plain: true });
  }

  return record;
};

const plainList = records => (records || []).map(plain);

const nameKeyOf = value => String(value === undefined || value === null ? '' : value).trim().toLowerCase();

const scheduleFields = (schedule = {}) => {
  switch (schedule.kind) {
    case 'now': {
      const runAt = schedule.runAt ? new Date(schedule.runAt) : new Date();

      return {
        kind: 'now',
        scheduleValue: 'now',
        rrule: null,
        runAt,
        nextRunAt: runAt,
        once: true,
      };
    }
    case 'in': {
      const durationMs = Number(schedule.durationMs);
      const millis = Number.isFinite(durationMs) ? durationMs : 0;
      const runAt = schedule.runAt
        ? new Date(schedule.runAt)
        : new Date(Date.now() + millis);

      return {
        kind: 'in',
        scheduleValue: String(millis),
        rrule: null,
        runAt,
        nextRunAt: runAt,
        once: true,
      };
    }
    case 'at': {
      if (!schedule.runAt) {
        throw new Error('Agendamento "at" requer runAt');
      }

      const runAt = new Date(schedule.runAt);

      return {
        kind: 'at',
        scheduleValue: runAt.toISOString(),
        rrule: null,
        runAt,
        nextRunAt: runAt,
        once: true,
      };
    }
    case 'rrule': {
      const rrule = String(schedule.rrule || schedule.scheduleValue || '').trim();

      if (!rrule) {
        throw new Error('Agendamento "rrule" requer rrule');
      }

      return {
        kind: 'rrule',
        scheduleValue: rrule,
        rrule,
        runAt: null,
        nextRunAt: null,
        once: !!schedule.once,
      };
    }
    case 'cron': {
      const cron = String(schedule.cron || schedule.scheduleValue || '').trim();

      if (!cron) {
        throw new Error('Agendamento "cron" requer cron');
      }

      return {
        kind: 'cron',
        scheduleValue: cron,
        rrule: null,
        runAt: null,
        nextRunAt: null,
        once: !!schedule.once,
      };
    }
    default:
      throw new Error(`Agendamento desconhecido: ${schedule.kind}`);
  }
};

const identityFields = ({ name, nameKey, prompt } = {}) => {
  const values = {};

  if (name !== undefined) {
    values.name = name;
  }

  if (name !== undefined || nameKey !== undefined) {
    values.nameKey = nameKeyOf(nameKey === undefined ? name : nameKey);
  }

  if (prompt !== undefined) {
    values.prompt = prompt;
  }

  return values;
};

const createAgent = async ({
  guildId,
  channelId,
  ownerId,
  name,
  nameKey,
  prompt,
  schedule,
} = {}) => {
  const values = {
    guildId,
    channelId,
    ownerId,
    timezone: TIMEZONE,
    status: ACTIVE,
    ...identityFields({ name, nameKey, prompt }),
    ...scheduleFields(schedule),
  };
  const record = await db.Agents.create(values);

  return plain(record);
};

const getAgent = async ({ guildId, nameKey, ownerId } = {}) => {
  const where = {
    guildId,
    nameKey: nameKeyOf(nameKey),
  };

  if (ownerId !== undefined) {
    where.ownerId = ownerId;
  }

  const record = await db.Agents.findOne({ where });

  return plain(record);
};

const listAgents = async ({ guildId, ownerId } = {}) => {
  const where = {};

  if (guildId !== undefined) {
    where.guildId = guildId;
  }

  if (ownerId !== undefined) {
    where.ownerId = ownerId;
  }

  const records = await db.Agents.findAll({
    where,
    order: [['nameKey', 'ASC']],
  });

  return plainList(records);
};

const updateAgent = async (id, patch = {}) => {
  const record = await db.Agents.findByPk(id);

  if (!record) {
    return null;
  }

  const { nameKey, schedule, ...rest } = patch;
  const values = { ...rest };

  if (nameKey !== undefined || patch.name !== undefined) {
    values.nameKey = nameKeyOf(nameKey === undefined ? patch.name : nameKey);
  }

  if (schedule !== undefined) {
    Object.assign(values, scheduleFields(schedule));
  }

  if (Object.keys(values).length > 0) {
    await record.update(values);
  }

  return plain(record);
};

const deleteAgent = async ({ guildId, nameKey, ownerId } = {}) => {
  const where = {
    guildId,
    nameKey: nameKeyOf(nameKey),
  };

  if (ownerId !== undefined) {
    where.ownerId = ownerId;
  }

  return db.Agents.destroy({ where });
};

const listRestorableAgents = async () => {
  const records = await db.Agents.findAll({
    where: {
      status: ACTIVE,
    },
    order: [['nextRunAt', 'ASC'], ['id', 'ASC']],
  });

  return plainList(records);
};

module.exports = {
  createAgent,
  getAgent,
  listAgents,
  updateAgent,
  deleteAgent,
  listRestorableAgents,
};
