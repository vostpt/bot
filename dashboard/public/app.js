'use strict';

const $ = (id) => document.getElementById(id);
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const pct = (value) => Math.max(0, Math.min(100, Number(value) || 0));

function clock(iso) {
  const time = Date.parse(iso || '');
  if (!Number.isFinite(time)) return '—';
  return new Date(time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function duration(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—';
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function barClass(worker) {
  if (worker.status === 'completed') return 'done';
  if (worker.status === 'failed') return 'failed';
  return worker.status;
}

function workerCard(worker) {
  const p = pct(worker.progress);
  const meta = [
    worker.files?.total ? `${worker.files.touched}/${worker.files.total} files` : null,
    Number.isFinite(worker.toolCalls) ? `${worker.toolCalls} tool calls` : null,
    Number.isFinite(worker.turns) ? `${worker.turns} turns` : null,
    worker.costUsd != null ? `$${worker.costUsd}` : null,
    worker.elapsedMs != null ? duration(worker.elapsedMs) : null,
  ].filter(Boolean);

  const timeline = (worker.activity || []).length
    ? `<ul class="timeline">${worker.activity.map((item) => `
        <li><time>${clock(item.at ? new Date(item.at).toISOString() : null)}</time>
        <span class="tool">${esc(item.tool)}</span><span>${esc(item.step)}</span></li>`).join('')}</ul>`
    : '';

  return `
    <article class="worker">
      <div class="worker-head">
        <div>
          <div class="worker-key">${esc(worker.key)}</div>
          <h3>${esc(worker.label)}</h3>
          <span class="status ${esc(worker.status)}">${esc(worker.status)}</span>
        </div>
        <div class="worker-pct">${p}%</div>
      </div>
      <div class="bar"><div class="bar-fill ${barClass(worker)}" style="width:${p}%"></div></div>
      <div class="step-line"><strong>${esc(worker.currentStep)}</strong></div>
      <p class="detail">${esc(worker.detail)}</p>
      <div class="meta-row">${meta.map((item) => `<span>${esc(item)}</span>`).join('')}</div>
      ${timeline}
    </article>`;
}

function render(data) {
  const { summary = {}, source = {}, workers = [] } = data;
  const overall = pct(summary.progress);
  $('overall-pct').textContent = overall;
  $('overall-bar').style.width = `${overall}%`;
  $('overall-bar').className = `bar-fill${summary.failed ? ' failed' : summary.active === 0 && workers.length ? ' done' : ''}`;
  $('overall-meta').textContent = summary.total
    ? `${summary.completed} of ${summary.total} workers complete · ${summary.active} active`
    : 'No worker data found for this pane yet';
  $('stat-completed').textContent = summary.completed ?? 0;
  $('stat-active').textContent = summary.active ?? 0;
  $('stat-pending').textContent = summary.pending ?? 0;
  $('stat-failed').textContent = summary.failed ?? 0;
  $('current-step').textContent = summary.currentStep || '—';
  $('workflow-id').textContent = source.workflowId ? `run ${source.workflowId}` : '';
  $('pane-chip').textContent = source.paneId
    ? `${source.paneLabel || 'BusyBee'} · ${source.paneId} · ${source.paneStatus || 'unknown'}`
    : 'pane not found';
  $('pane-chip').className = `chip ${source.sessionFound ? 'chip-live' : 'chip-muted'}`;
  $('updated').textContent = `Updated ${clock(data.generatedAt)}`;
  $('workers').innerHTML = workers.length
    ? workers.map(workerCard).join('')
    : '<div class="panel muted">No workers detected.</div>';
}

async function refresh() {
  try {
    const response = await fetch('/api/status', { cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    render(await response.json());
  } catch (error) {
    $('current-step').textContent = 'Dashboard disconnected — retrying…';
    $('pane-chip').textContent = 'offline';
    $('pane-chip').className = 'chip chip-muted';
  }
}

$('refresh').addEventListener('click', refresh);
refresh();
setInterval(refresh, 5000);
