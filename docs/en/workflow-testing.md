# End-to-end workflow testing

The goal of workflow tests is to exercise a real bot workflow from controlled
input through message construction and destination selection, while stopping at
the external side-effect boundary. Tests must never publish to production.

## Current end-to-end examples

The workflow tests under `__tests__/workflows/` use fixed source responses,
real service/message-building code, and fake or dry-run destination boundaries.
They currently cover IPMA warnings, daily weather, forest fires, and the
scheduled fire-risk map, Facebook feed forwarding, and Official Journal decrees.

The IPMA warning example mocks the API and database, then checks real dry-run
publisher output for Discord, Twitter/X, Facebook, Telegram, Mastodon, and
Bluesky. The daily weather example supplies fixture image streams and verifies
the expected destinations. The forest-fire example checks grouping and urgent
Discord mentions. The fire-risk example captures the scheduled callback, mocks
the IPMA page response, and uses the real RCM parser and image renderer before
checking the Discord file payload. Facebook feed polling checks filtering,
Discord forwarding, and cursor advancement; the decree workflow checks
Discord/Mastodon/Twitter routing and repeat suppression.

These tests cover workflow orchestration and destination formatting without
posting. Database persistence and repeat-poll deduplication are still mocked;
scheduled callbacks are invoked directly rather than waiting for real times.

## Existing coverage and gaps

| Workflow | Current coverage | Remaining end-to-end coverage |
| --- | --- | --- |
| IPMA warning polling | Warning routing tests and dry-run publication-log example | Repeat-poll deduplication with SQLite; scheduler callback |
| Daily weather report | Fixture image streams through formatter and dry-run publishers | Repeat-run/database behavior |
| Forest fires | Fire fixture through real grouping and dry-run Discord output | Repeat-run/database behavior if state is added |
| Fire-risk map | Scheduled callback, mocked page, real RCM parsing/rendering, Discord file payload | Timer registration policy and upstream HTML drift fixture |
| Facebook feed polling | Feed fixture through service, filtering, cursor advancement, dry-run Discord forwarding | Actual SQLite cursor persistence |
| Official Journal decrees | Fixture through service, Discord/Mastodon/Twitter dry-run output, repeat suppression | Actual SQLite persistence |
| MeteoAlarm warnings | None at workflow level | Feed fixture, DB filtering and Europe-account Twitter thread |
| Medea messages | None at workflow level | CSV fixture, target filtering, persistence and VOSTPTia Twitter output |
| Travel advisories | None at workflow level | Page fixtures and expected Discord summary |
| Daily earthquakes | Command tests | Scheduled date selection and Discord summary for sensed/unsensed events |
| Noticeable earthquakes | Command tests | Threshold, once-per-day deduplication, Discord plus Twitter output |
| Rally capacity and info | None at workflow level | Capacity transitions and Twitter/Facebook/Telegram payloads |
| Slash command runtime | Builder loading and OP command tests | Interaction routing, permissions, cooldown, and representative command responses |
| Prefix triggers | None at workflow level | Trigger selection, handled/unhandled behavior, and channel restrictions |
| Disabled behavior | Corona exclusion covered by command-loading tests | Assert VOST Europe scheduled publishing remains disabled by default |

Offline module smoke tests confirm that modules load. Live smoke tests only
check credentials and API authentication; neither one covers the workflow gaps
in this table.

## Test harness design

Each workflow test should follow the same boundaries:

1. Feed a fixed source fixture to the real source parser or source adapter.
2. Run the real service that applies business rules and formats messages.
3. Use an isolated database to verify first-run and repeat-run state where the
   workflow persists cursors, warnings, or sent-event IDs.
4. Set `PUBLISH_MODE=dry-run` and use the real publication adapters to write
   JSONL entries instead of making outbound posts.
5. Assert destination, account/channel, text, media, and database state.
6. Repeat the workflow to verify it does not emit duplicate posts.
7. Simulate one destination failure and verify other destinations still run
   where the workflow is designed to isolate failures.

Use sanitized fixtures under `__tests__/fixtures/` for JSON, RSS, CSV, and HTML
responses. Do not use a developer's `.env`, production tokens, production
database, or live publication API in automated tests. Use a unique SQLite file
per test suite and remove it during teardown. When testing schedules, capture
the callback registered with `node-schedule` and invoke it directly instead of
waiting for the wall clock.

## Suggested implementation order

1. MeteoAlarm, Medea, and travel advisories: verify each source-specific parser
   and destination/account.
2. Earthquake scheduled jobs and Rally publications: verify thresholds,
   deduplication, and multi-network routing.
3. Runtime dispatch: add focused tests for slash cooldown/permission routing,
   remaining prefix triggers, scheduled-job registration, and intentionally
   disabled behavior.

Run the workflow tests with the full test command:

```sh
npm test -- --runInBand
```

Or run only the end-to-end workflow directory:

```sh
npm run test:e2e
```

The current IPMA example can be run alone with:

```sh
npm test -- --runInBand __tests__/workflows/ipma-warning.e2e.test.js
```
