const fs = require('fs');
const path = require('path');

const startedAt = new Date().toISOString();
const runId = process.env.SHADOW_RUN_ID || `${startedAt}-${process.pid}`;

const isDryRun = () => ['dry-run', 'shadow'].includes(
  (process.env.PUBLISH_MODE || '').trim().toLowerCase(),
);

// Social posting remains enabled by default for backward compatibility.
// Set SOCIAL_POSTS_ENABLED=false to keep Discord workflows active without
// sending any outbound posts to external social networks.
const isEnvEnabled = (name, defaultEnabled = true) => {
  const value = process.env[name];
  if (value === undefined || value.trim() === '') return defaultEnabled;
  return !['false', '0', 'no', 'off'].includes(value.trim().toLowerCase());
};

const toEnvPart = (value) => String(value).replace(/([a-z])([A-Z])/g, '$1_$2')
  .replace(/[^a-zA-Z0-9]+/g, '_')
  .replace(/^_|_$/g, '')
  .toUpperCase();

const areSocialPostsEnabled = (network, profile) => {
  if (!isEnvEnabled('SOCIAL_POSTS_ENABLED')) return false;
  if (network && !isEnvEnabled(`SOCIAL_${toEnvPart(network)}_ENABLED`)) return false;
  if (network && profile
    && !isEnvEnabled(`SOCIAL_${toEnvPart(network)}_${toEnvPart(profile)}_ENABLED`)) {
    return false;
  }
  return true;
};

const skipSocialPost = (network, profile = 'main') => {
  // Shadow mode records planned output through each adapter's dry-run path.
  // Live-publishing switches must not hide those preview entries.
  if (isDryRun()) return false;
  if (areSocialPostsEnabled(network, profile)) return false;
  console.log(`[SOCIAL-DISABLED] Skipping outbound ${network}/${profile} publication`);
  return true;
};

const sanitize = (value, seen = new WeakSet()) => {
  if (Buffer.isBuffer(value)) {
    return `<Buffer ${value.length} bytes>`;
  }

  if (typeof value === 'string' && value.length > 10000) {
    return `<Long string ${value.length} characters; preview: ${value.slice(0, 160)}...>`;
  }

  if (!value || typeof value !== 'object') return value;
  if (seen.has(value)) return '<Circular reference>';
  seen.add(value);

  if (Array.isArray(value)) return value.map((item) => sanitize(item, seen));

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, item]) => typeof item !== 'function')
      .map(([key, item]) => [key, sanitize(item, seen)]),
  );
};

const getLogPath = () => path.resolve(
  process.env.PUBLISH_LOG_FILE || 'logs/publications.jsonl',
);

const recordPublication = (destination, payload) => {
  const entry = {
    timestamp: new Date().toISOString(),
    runId,
    mode: 'dry-run',
    destination,
    payload: sanitize(payload),
  };
  const logPath = getLogPath();

  fs.mkdirSync(path.dirname(logPath), { recursive: true });
  fs.appendFileSync(logPath, `${JSON.stringify(entry)}\n`, 'utf8');

  console.log(`\n[DRY-RUN] Would publish to ${destination}:`);
  console.log(JSON.stringify(entry.payload, null, 2));

  return { dryRun: true, destination, entry, logPath };
};

module.exports = {
  getLogPath,
  isDryRun,
  areSocialPostsEnabled,
  skipSocialPost,
  recordPublication,
  sanitize,
};
