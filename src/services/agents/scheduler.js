const DEFAULT_TIMEZONE = 'Europe/Lisbon';

const scheduleOf = (agent) => {
  if (!agent) {
    return {};
  }

  const nested = agent.schedule && typeof agent.schedule === 'object' && !(agent.schedule instanceof Date)
    ? agent.schedule
    : {};

  return { ...agent, ...nested };
};

const createAgentScheduler = ({
  repository,
  runner,
  schedule = require('node-schedule'),
  createRRule = ({ rrule, dtstart, tzid }) => {
    const { RRule } = require('rrule');

    return RRule.fromString(rrule, { dtstart, tzid });
  },
  createCron = ({ cron, tzid, currentDate }) => {
    const parser = require('cron-parser');
    const iterator = parser.parseExpression(cron, { tz: tzid, currentDate });
    const next = iterator.next();

    return next && typeof next.toDate === 'function' ? next.toDate() : next;
  },
  now = () => new Date(),
} = {}) => {
  const jobs = new Map();

  const cancelAgent = (id) => {
    const job = jobs.get(id);

    if (job && typeof job.cancel === 'function') {
      job.cancel();
    }

    jobs.delete(id);
  };

  const timezoneOf = agent => agent.timezone || DEFAULT_TIMEZONE;

  const nextOccurrence = (agent) => {
    const { rrule } = scheduleOf(agent);
    const rule = createRRule({
      dtstart: new Date(agent.createdAt || now()),
      tzid: timezoneOf(agent),
      rrule,
    });

    return rule && typeof rule.after === 'function' ? rule.after(now(), true) : null;
  };

  const nextCron = (agent) => {
    const { cron } = scheduleOf(agent);

    if (!cron) {
      return null;
    }

    const next = createCron({
      cron,
      tzid: timezoneOf(agent),
      currentDate: now(),
    });

    return next ? new Date(next) : null;
  };

  const arm = (agent, at, onFire) => {
    const when = new Date(at);

    if (Number.isNaN(when.getTime())) {
      console.warn(`[agents] data de execução inválida para "${agent.name || agent.id}"`);
      return;
    }

    const job = schedule.scheduleJob(when, async () => {
      try {
        await onFire();
      } catch (error) {
        console.error('[agents] falha na execução agendada', error);
      }
    });

    jobs.set(agent.id, job);
  };

  const onComplete = (agent, extra = {}) => repository.updateAgent(agent.id, {
    status: 'done',
    lastRunAt: now(),
    ...extra,
  });

  const scheduleAgent = (agent) => {
    if (!agent || agent.id === undefined || agent.id === null) {
      return;
    }

    cancelAgent(agent.id);

    const info = scheduleOf(agent);

    if (info.kind === 'now') {
      return;
    }

    if (info.kind === 'at' || info.kind === 'in') {
      arm(agent, info.runAt, async () => {
        try {
          await runner.runAgent(agent);
          await onComplete(agent);
        } finally {
          jobs.delete(agent.id);
        }
      });

      return;
    }

    if (info.kind === 'rrule') {
      const next = nextOccurrence(agent);

      if (!next) {
        if (info.once) {
          repository.updateAgent(agent.id, { status: 'expired' }).catch(() => {});
        }

        return;
      }

      arm(agent, next, async () => {
        try {
          await runner.runAgent(agent);

          if (info.once) {
            await onComplete(agent);
            return;
          }

          await repository.updateAgent(agent.id, {
            lastRunAt: now(),
            nextRunAt: nextOccurrence(agent) || null,
          });
        } finally {
          jobs.delete(agent.id);

          if (!info.once) {
            scheduleAgent(agent);
          }
        }
      });

      return;
    }

    if (info.kind === 'cron') {
      if (info.once) {
        const next = nextCron(agent);

        if (!next) {
          return;
        }

        arm(agent, next, async () => {
          try {
            await runner.runAgent(agent);
            await onComplete(agent);
          } finally {
            jobs.delete(agent.id);
          }
        });

        return;
      }

      const job = schedule.scheduleJob(info.scheduleValue || info.cron, async () => {
        try {
          await runner.runAgent(agent);
          await repository.updateAgent(agent.id, {
            lastRunAt: now(),
            nextRunAt: nextCron(agent) || null,
          });
        } catch (error) {
          console.error('[agents] falha na execução agendada', error);
        }
      });

      if (job) {
        jobs.set(agent.id, job);
      }
    }
  };

  const restore = async () => {
    const agents = await repository.listRestorableAgents();

    for (const agent of agents || []) {
      const info = scheduleOf(agent);

      if (info.kind === 'now') {
        await repository.updateAgent(agent.id, { status: 'expired' });
        continue;
      }

      if (info.kind === 'at' || info.kind === 'in') {
        const runAt = new Date(info.runAt);

        if (!Number.isNaN(runAt.getTime()) && runAt.getTime() <= now().getTime()) {
          await repository.updateAgent(agent.id, { status: 'expired' });
          continue;
        }
      }

      scheduleAgent(agent);
    }
  };

  const shutdown = () => {
    [...jobs.keys()].forEach((id) => cancelAgent(id));
  };

  return { scheduleAgent, cancelAgent, restore, shutdown, jobs };
};

module.exports = {
  createAgentScheduler,
  DEFAULT_TIMEZONE,
};
