'use strict';


const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const HOME = os.homedir();
const SESSION_ROOT = path.join(HOME, '.pi', 'agent', 'sessions');
const PANEL_LABEL = process.env.BUSYBEE_PANE_LABEL || 'BusyBee';
const FALLBACK_WORKERS = {
  data: 'Data model, parser and repository',
  scheduler: 'Scheduler and runner',
  commands: 'Commands, help, config and event wiring',
};

function readJsonl(file) {
  if (!file || !fs.existsSync(file)) return [];
  const rows = [];
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim()) continue;
    try {
      rows.push(JSON.parse(line));
    } catch (_) {
    }
  }
  return rows;
}

function eachString(value, visit) {
  if (typeof value === 'string') {
    visit(value);
  } else if (Array.isArray(value)) {
    for (const item of value) eachString(item, visit);
  } else if (value && typeof value === 'object') {
    for (const item of Object.values(value)) eachString(item, visit);
  }
}

function safe(text, max = 240) {
  const cleaned = String(text || '')
    .replace(/\s+/g, ' ')
    .replace(/(sk-[A-Za-z0-9_-]{8,}|Bearer\s+[A-Za-z0-9._-]+|[A-Z0-9_]*(?:API_KEY|TOKEN|SECRET|PASSWORD)=[^\s]+)/gi, '[redacted]')
    .trim();
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function shortPath(value, max = 60) {
  const text = String(value || '').trim();
  if (!text) return 'file';
  return text.length > max ? `…${text.slice(-max + 1)}` : text;
}

function findBusyBeePane() {
  if (process.env.BUSYBEE_SESSION_FILE && fs.existsSync(process.env.BUSYBEE_SESSION_FILE)) {
    return { pane: null, sessionFile: process.env.BUSYBEE_SESSION_FILE };
  }

  try {
    const output = execFileSync('herdr', ['pane', 'list'], {
      encoding: 'utf8',
      timeout: 5000,
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const panes = JSON.parse(output).result?.panes || [];
    const targetPaneId = process.env.BUSYBEE_PANE_ID;
    const pane = panes.find((entry) => targetPaneId
      ? entry.pane_id === targetPaneId
      : String(entry.label || '').toLowerCase() === PANEL_LABEL.toLowerCase());
    if (pane) {
      const sessionFile = pane.agent_session?.value;
      if (sessionFile && sessionFile.endsWith('.jsonl') && fs.existsSync(sessionFile)) {
        return { pane, sessionFile };
      }
      return { pane, sessionFile: null };
    }
  } catch (_) {
  }
  return { pane: null, sessionFile: null };
}

function newestSessionWithWorkflow() {
  const files = [];
  try {
    for (const dir of fs.readdirSync(SESSION_ROOT)) {
      const full = path.join(SESSION_ROOT, dir);
      if (!fs.statSync(full).isDirectory()) continue;
      for (const name of fs.readdirSync(full)) {
        if (name.endsWith('.jsonl')) files.push(path.join(full, name));
      }
    }
  } catch (_) {
    return null;
  }
  files.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  for (const file of files.slice(0, 12)) {
    const fd = fs.openSync(file, 'r');
    const buffer = Buffer.alloc(Math.min(fs.fstatSync(fd).size, 2 * 1024 * 1024));
    fs.readSync(fd, buffer, 0, buffer.length, 0);
    fs.closeSync(fd);
    if (buffer.includes('Async workflow [')) return file;
  }
  return null;
}

function parseParentSession(sessionFile) {
  const rows = readJsonl(sessionFile);
  let workflowId = null;
  let launchCallId = null;
  const specs = new Map();
  const notices = new Map();
  const specRegex = /key:\s*['"]([a-z][a-z0-9_-]*)['"],\s*label:\s*['"]([^'"]+)['"]/g;
  const allSpecs = new Map();
  const collectInto = (map, text) => {
    let match;
    while ((match = specRegex.exec(text)) !== null) map.set(match[1], match[2]);
  };
  const collectSpecs = (text) => collectInto(specs, text);
  for (const row of rows) eachString(row, (text) => collectInto(allSpecs, text));

  for (const row of rows) {
    if (row.type !== 'message' || row.message?.role !== 'toolResult') continue;
    eachString(row.message, (text) => {
      const found = text.match(/Async workflow \[([0-9a-f-]{36})\]/i);
      if (found) {
        workflowId = found[1];
        launchCallId = row.message.toolCallId;
      }
    });
  }
  for (const row of rows) {
    if (row.type !== 'message' || row.message?.role !== 'assistant') continue;
    const calls = (row.message.content || []).filter((item) => item?.type === 'toolCall');
    const launch = launchCallId ? calls.find((call) => call.id === launchCallId) : null;
    if (launch) {
      eachString(launch.arguments, (text) => {
        collectSpecs(text);
        const script = text.trim();
        if (/\.js$/.test(script) && fs.existsSync(script)) {
          collectSpecs(fs.readFileSync(script, 'utf8'));
        }
      });
    }
  }

  for (const row of rows) {
    if (row.type !== 'custom_message' || row.customType !== 'subagent-incremental-child-notify') continue;
    const content = String(row.content || '');
    if (workflowId && !content.includes(workflowId)) continue;
    const key = row.details?.childKey;
    if (!key) continue;
    const runId = content.match(/Child run:\s*([0-9a-f-]{36})/i)?.[1] || null;
    const outputPath = content.match(/Output:\s*(\S+\.md)/)?.[1] || null;
    notices.set(key, {
      key,
      outcome: row.details?.outcome || 'unknown',
      runId,
      outputPath,
      at: Date.parse(row.timestamp || '') || null,
    });
  }
  for (const key of notices.keys()) {
    if (!specs.has(key)) specs.set(key, allSpecs.get(key) || FALLBACK_WORKERS[key] || key);
  }

  let panelStep = null;
  for (const row of rows) {
    if (row.type !== 'message') continue;
    eachString(row.message, (text) => {
      if (/subagent \(worker\)/.test(text)) panelStep = safe(text, 160);
    });
  }
  return { workflowId, specs, notices, panelStep };
}

function describeTool(name, args, preview) {
  if (name === 'bash') {
    const command = String(args.command || preview || '');
    if (/\bjest\b|npm test|npx test/.test(command)) return 'Running tests';
    if (/eslint/.test(command)) return 'Running lint';
    if (/git (status|diff|log)/.test(command)) return 'Reviewing changes';
    if (/npm (run|view|ls)/.test(command)) return 'Checking dependencies';
    if (/\b(ls|find|rg|grep|cat|sed|pwd)\b/.test(command)) return 'Inspecting files';
    return 'Running command';
  }
  if (name === 'edit') return `Editing ${shortPath(args.path || preview)}`;
  if (name === 'write') return `Writing ${shortPath(args.path || preview)}`;
  if (name === 'read') return `Reading ${shortPath(args.path || preview)}`;
  return `Using ${name || 'tool'}`;
}

function parseTranscript(file) {
  const rows = readJsonl(file);
  const result = {
    runId: rows.find((row) => row.runId)?.runId || null,
    startedAt: null,
    lastAt: null,
    toolCount: 0,
    ownFiles: [],
    touchedFiles: new Set(),
    activity: [],
    lastStep: null,
    note: null,
    hasTests: false,
    hasLint: false,
  };

  for (const row of rows) {
    if (Number.isFinite(row.ts)) {
      if (!result.startedAt) result.startedAt = row.ts;
      result.lastAt = row.ts;
    }

    if (typeof row.text === 'string'
        && (row.sourceEventType === 'task' || row.sourceEventType === 'initial_prompt'
          || (row.role === 'user' && row.text.startsWith('Task:')))) {
      const files = row.text.match(/Own ONLY these files:\s*([^\n]+)/)?.[1];
      if (files) {
        result.ownFiles = files
          .split(',')
          .map((item) => item.trim().replace(/\.$/, ''))
          .filter(Boolean);
      }
      if (/DATA LANE/i.test(row.text)) result.lane = 'data';
      else if (/EXECUTION LANE/i.test(row.text)) result.lane = 'scheduler';
      else if (/COMMAND LANE/i.test(row.text)) result.lane = 'commands';
    }

    if (row.recordType === 'tool_start') {
      result.toolCount += 1;
      let args = {};
      try {
        args = JSON.parse(row.argsPayload || '{}');
      } catch (_) {
        args = {};
      }
      const target = args.path || (Array.isArray(args.edits) && args.edits[0]?.path);
      if (['edit', 'write'].includes(row.toolName) && target) result.touchedFiles.add(target);
      if (row.toolName === 'bash') {
        const command = String(args.command || row.argsPreview || '');
        if (/\bjest\b|npm test/.test(command)) result.hasTests = true;
        if (/eslint/.test(command)) result.hasLint = true;
      }
      const step = describeTool(row.toolName, args, row.argsPreview);
      result.lastStep = step;
      result.activity.push({ at: row.ts || null, step, tool: row.toolName || 'tool' });
    }

    if (row.recordType === 'message' && row.role === 'assistant' && typeof row.text === 'string' && row.text.trim()) {
      result.note = row.text.trim();
    }
  }
  return result;
}

function listArtifactDir(sessionFile) {
  return path.join(path.dirname(sessionFile), 'subagent-artifacts');
}

function readMeta(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (_) {
    return null;
  }
}

function readSummary(file) {
  if (!file || !fs.existsSync(file)) return null;
  for (const line of fs.readFileSync(file, 'utf8').split('\n')) {
    if (!line.trim() || /^#/.test(line.trim())) continue;
    return safe(line.replace(/^[-*>\s]+/, ''), 200);
  }
  return null;
}

function buildWorker(key, label, notice, transcriptInfo, meta, outputPath, artifactDir) {
  const owned = transcriptInfo?.ownFiles || [];
  const touched = transcriptInfo ? [...transcriptInfo.touchedFiles].filter((file) => owned.includes(file)) : [];
  let progress = 0;
  if (transcriptInfo) {
    const ratio = owned.length ? touched.length / owned.length : Math.min(1, transcriptInfo.toolCount / 40);
    progress = 6 + Math.round(ratio * 68);
    if (transcriptInfo.hasTests) progress += 14;
    if (transcriptInfo.hasLint) progress += 6;
  }
  if (meta || notice?.outcome === 'completed') progress = 100;
  progress = Math.max(0, Math.min(100, progress));

  const outcome = notice?.outcome || (meta && Number(meta.exitCode) === 0 ? 'completed' : null);
  let status = 'pending';
  if (outcome === 'completed' || outcome === 'failed') status = outcome;
  else if (transcriptInfo) status = 'active';

  const summaryPath = outputPath || (meta && artifactDir && meta.runId
    ? path.join(artifactDir, `${meta.runId}_worker_output.md`)
    : null);
  const summary = readSummary(summaryPath);
  const currentStep = status === 'completed'
    ? 'Done — summary available'
    : transcriptInfo?.lastStep || (status === 'active' ? 'Starting up' : 'Waiting to start');

  return {
    key,
    label: label || FALLBACK_WORKERS[key] || key,
    status,
    progress,
    currentStep,
    detail: summary || (status === 'completed' ? 'Worker finished' : safe(transcriptInfo?.note, 200)) || '—',
    activity: (transcriptInfo?.activity || []).slice(-6).reverse(),
    files: { touched: touched.length, total: owned.length },
    toolCalls: transcriptInfo?.toolCount || 0,
    turns: meta?.usage?.turns || null,
    costUsd: meta?.usage?.cost != null ? Number(meta.usage.cost.toFixed(4)) : null,
    elapsedMs: transcriptInfo?.startedAt && transcriptInfo?.lastAt
      ? transcriptInfo.lastAt - transcriptInfo.startedAt
      : null,
    lastActivityAt: transcriptInfo?.lastAt ? new Date(transcriptInfo.lastAt).toISOString() : null,
    runId: notice?.runId || transcriptInfo?.runId || meta?.runId || null,
  };
}

function collectStatus() {
  const found = findBusyBeePane();
  const sessionFile = found.sessionFile || newestSessionWithWorkflow();
  const parent = sessionFile ? parseParentSession(sessionFile) : { workflowId: null, specs: new Map(), notices: new Map(), panelStep: null };

  const artifactDir = sessionFile ? listArtifactDir(sessionFile) : null;
  const transcripts = [];
  if (artifactDir && fs.existsSync(artifactDir)) {
    for (const name of fs.readdirSync(artifactDir).filter((entry) => entry.endsWith('_worker_transcript.jsonl'))) {
      const runId = name.replace(/_worker_transcript\.jsonl$/, '');
      transcripts.push({ runId, info: parseTranscript(path.join(artifactDir, name)) });
    }
  }

  const keys = new Set([...parent.specs.keys(), ...parent.notices.keys()]);
  const noticedRunIds = new Set([...parent.notices.values()].map((notice) => notice.runId).filter(Boolean));
  const relevant = transcripts.filter((entry) => noticedRunIds.has(entry.runId)
    || (entry.info.lane && keys.has(entry.info.lane)));

  const workers = [...keys].map((key) => {
    const notice = parent.notices.get(key) || null;
    const noticedRunId = notice?.runId;
    const matched = relevant.find((entry) => entry.runId === noticedRunId)
      || relevant.find((entry) => entry.info.lane === key)
      || (!noticedRunId && relevant.length === 1 ? relevant[0] : null);
    const runId = matched?.runId || noticedRunId;
    const meta = runId && artifactDir ? readMeta(path.join(artifactDir, `${runId}_worker_meta.json`)) : null;
    const outputPath = notice?.outputPath
      || (runId && artifactDir && fs.existsSync(path.join(artifactDir, `${runId}_worker_output.md`))
        ? path.join(artifactDir, `${runId}_worker_output.md`)
        : null);
    return buildWorker(
      key,
      parent.specs.get(key),
      notice,
      matched?.info || null,
      meta,
      outputPath,
      artifactDir,
    );
  });

  workers.sort((a, b) => {
    const order = { active: 0, pending: 1, failed: 2, completed: 3 };
    return (order[a.status] ?? 4) - (order[b.status] ?? 4) || a.key.localeCompare(b.key);
  });

  const counts = workers.reduce((acc, worker) => {
    acc[worker.status] = (acc[worker.status] || 0) + 1;
    return acc;
  }, {});
  const progress = workers.length
    ? Math.round(workers.reduce((sum, worker) => sum + worker.progress, 0) / workers.length)
    : 0;

  return {
    generatedAt: new Date().toISOString(),
    source: {
      paneId: found.pane?.pane_id || process.env.BUSYBEE_PANE_ID || null,
      paneLabel: found.pane?.label || (sessionFile ? PANEL_LABEL : null),
      paneStatus: found.pane?.agent_status || null,
      sessionFile: sessionFile ? path.relative(HOME, sessionFile) : null,
      workflowId: parent.workflowId,
      sessionFound: Boolean(sessionFile),
    },
    summary: {
      total: workers.length,
      completed: counts.completed || 0,
      active: counts.active || 0,
      pending: counts.pending || 0,
      failed: counts.failed || 0,
      progress,
      currentStep: found.pane?.tokens?.summary || parent.panelStep
        || workers.find((worker) => worker.status === 'active')?.currentStep
        || (workers.length ? 'All workers finished — integration pending in the BusyBee pane' : null),
    },
    workers,
  };
}

if (require.main === module) {
  console.log(JSON.stringify(collectStatus(), null, 2));
}

module.exports = { collectStatus };
