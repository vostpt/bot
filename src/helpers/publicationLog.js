const fs = require('fs');
const path = require('path');

const startedAt = new Date().toISOString();
const runId = process.env.SHADOW_RUN_ID || `${startedAt}-${process.pid}`;

const isDryRun = () => ['dry-run', 'shadow'].includes(
  (process.env.PUBLISH_MODE || '').trim().toLowerCase(),
);

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
  recordPublication,
  sanitize,
};
