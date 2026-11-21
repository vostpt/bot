# BusyBee worker dashboard

Live, read-only view of the workers launched from the **BusyBee** Herdr pane. It shows an overall progress bar, each worker's status and progress, its current step, recent tool activity, and the pane's own status label. The page refreshes every 5 seconds.

## Run

```sh
npm run dashboard
# open http://127.0.0.1:4310
```

Options:

```sh
node dashboard/server.js --port 4311        # another port
DASHBOARD_PORT=4311 npm run dashboard       # same, via env
node dashboard/status.js                   # raw JSON snapshot to stdout
```

The server binds to `127.0.0.1` only. No npm dependencies beyond Node's standard library.

## Data sources

Nothing is written or sent anywhere. The collector reads:

1. `herdr pane list` — finds the pane labelled `BusyBee` and its PI session file.
2. `<session>.jsonl` — workflow id, worker names, and child completion notices.
3. `subagent-artifacts/*_worker_transcript.jsonl` — tool calls, owned files, current step.
4. `*_worker_meta.json` / `*_worker_output.md` — completion and summary evidence.

If Herdr is not available, set `BUSYBEE_SESSION_FILE` to the session JSONL path. `BUSYBEE_PANE_ID` and `BUSYBEE_PANE_LABEL` can also override pane discovery.

## Progress semantics

`100%` means the worker has a completion artifact. For a running worker the bar combines owned files edited (0–68%), test/lint runs (+14/+6%), and a small start offset. It is a signals-based indicator, not a wall-clock estimate.

The pane's `current step` comes from Herdr's live status label when available, otherwise from the active worker's last tool action.

## Endpoints

- `GET /` — dashboard UI
- `GET /api/status` — JSON payload consumed by the UI
