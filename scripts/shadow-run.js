require('dotenv').config();

// These assignments happen before application modules are loaded. Shadow runs
// can never use the production database or live publication adapters.
process.env.NODE_ENV = 'shadow';
process.env.PUBLISH_MODE = 'dry-run';

const { db } = require('../src/database/models');
const Jobs = require('../src/jobs');
const {
  Facebook,
  Fires,
  Ipma,
  Journal,
  MeteoAlarm,
  Viajar,
  Weather,
} = require('../src/services');
const { RcmApi } = require('../src/api');
const { getLogPath, recordPublication } = require('../src/helpers/publicationLog');

const availableTargets = [
  'warnings',
  'weather',
  'fires',
  'fire-risk',
  'meteoalarm',
  'decrees',
  'travel',
  'facebook-feed',
];

const args = process.argv.slice(2);
const watch = args.includes('--watch');
const help = args.includes('--help') || args.includes('-h');
const requestedTargets = args.filter((argument) => !argument.startsWith('--'));

const shadowChannel = (channelId) => ({
  id: channelId || 'unconfigured',
  name: `shadow-${channelId || 'unconfigured'}`,
  send: async (payload) => recordPublication('discord', {
    channelId,
    text: typeof payload === 'string' ? payload : payload?.content,
    files: typeof payload === 'object' ? payload?.files : [],
  }),
});

const shadowClient = {
  channels: {
    cache: new Map(),
    fetch: async (channelId) => shadowChannel(channelId),
  },
};

const workflows = {
  warnings: () => Ipma.getWarnings(shadowClient),
  weather: () => Weather.getDailyReport(shadowClient),
  fires: () => Fires.getForestFires(shadowClient),
  'fire-risk': async () => {
    const result = await RcmApi.fetch();
    return recordPublication('discord', {
      channel: 'fires',
      text: '🔥 Risco de Incêndio para hoje',
      files: result ? [{ attachment: result.attachment, name: result.name }] : [],
    });
  },
  meteoalarm: () => MeteoAlarm.getWarnings(),
  decrees: () => Journal.checkNewDecrees(shadowClient),
  travel: () => Viajar.checkNewTravelAdvices(shadowClient),
  'facebook-feed': () => Facebook.getVostPostsAndSendToDiscord(shadowClient),
};

const printHelp = () => {
  console.log(`Usage:
  npm run shadow -- [targets]
  npm run shadow:watch

Default one-shot targets: warnings weather fires
Available targets: ${availableTargets.join(', ')}

Examples:
  SHADOW_RESET_DB=true npm run shadow -- warnings weather
  PUBLISH_LOG_FILE=logs/mac-shadow.jsonl npm run shadow -- fires fire-risk

SHADOW_RESET_DB=true recreates only data/db.shadow.sqlite so current items are
treated as unseen. --watch uses the normal job schedules and never logs in to
Discord or publishes to a social network.`);
};

const prepareDatabase = async () => {
  const reset = process.env.SHADOW_RESET_DB === 'true';
  await db.sequelize.sync({ force: reset });
  if (reset) console.warn('[shadow] Reset data/db.shadow.sqlite');
};

const close = async (exitCode = 0) => {
  await db.sequelize.close();
  process.exitCode = exitCode;
};

const runOnce = async () => {
  const targets = requestedTargets.length
    ? requestedTargets
    : ['warnings', 'weather', 'fires'];
  const unknown = targets.filter((target) => !workflows[target]);

  if (unknown.length) {
    throw new Error(`Unknown shadow targets: ${unknown.join(', ')}`);
  }

  let failed = false;
  for (const target of targets) {
    console.log(`\n[shadow] Running ${target}...`);
    try {
      await workflows[target]();
      console.log(`[shadow] ${target}: complete`);
    } catch (error) {
      failed = true;
      console.error(`[shadow] ${target}: failed: ${error.message}`);
    }
  }

  console.log(`\n[shadow] Publication log: ${getLogPath()}`);
  await close(failed ? 1 : 0);
};

const runWatch = async () => {
  console.log(`[shadow] Watching normal production schedules.`);
  console.log(`[shadow] Publication log: ${getLogPath()}`);
  new Jobs(shadowClient).startProd();

  const shutdown = async () => {
    console.log('\n[shadow] Stopping...');
    await close(0);
  };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
};

const main = async () => {
  if (help) {
    printHelp();
    await close(0);
    return;
  }

  await prepareDatabase();
  if (watch) await runWatch();
  else await runOnce();
};

main().catch(async (error) => {
  console.error(`[shadow] ${error.message}`);
  await close(1);
});
