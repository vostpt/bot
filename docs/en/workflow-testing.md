# End-to-end workflow testing

The goal of workflow tests is to exercise a real bot workflow from controlled
input through message construction and destination selection, while stopping at
the external side-effect boundary. Tests must never publish to production.

## Current end-to-end example

`__tests__/workflows/ipma-warning.e2e.test.js` is the first workflow-level
example. It supplies a fixed warning from a mocked
IPMA API and an empty mocked warning store, then runs the real warning service
and the real dry-run publisher adapters. It reads the resulting JSONL log and
checks the Discord, Twitter/X, Facebook, Telegram, Mastodon, and Bluesky
destinations and payloads.

The API and database are mocked in this first example. It therefore proves
service orchestration, message construction, destination selection, adapter
dry-run behavior, and log formatting. It does not prove IPMA HTML parsing,
SQLite persistence, or the scheduled timer that invokes the workflow; those
should be covered in separate tests.

## Existing coverage and gaps

| Workflow | Current coverage | Remaining end-to-end coverage |
| --- | --- | --- |
| IPMA warning polling | Warning routing tests and dry-run publication-log example | Repeat-poll deduplication with SQLite; scheduler callback |
| Daily weather report | Command and adapter tests | Source fixture through image/text creation to all configured destinations |
| Forest fires | None at workflow level | Fire feed fixture, severity grouping, Discord output |
| Fire-risk map | RCM parser test | RCM source fixture through render to Discord file payload |
| Facebook feed polling | Facebook adapter tests | Feed fixture, persisted cursor, filtering and Discord delivery on repeat poll |
| Official Journal decrees | None at workflow level | RSS fixture, persistence/deduplication, Discord/Mastodon/Twitter outputs |
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

1. Daily weather: it fans out to the most social destinations and gives a
   reusable example of image and text assertions.
2. Fire-risk map and forest-fire alerts: verify both file delivery and normal
   text alerts in the Discord channel.
3. Facebook feed and official decrees: verify database cursors/deduplication
   and repeat-poll behavior.
4. MeteoAlarm, Medea, and travel advisories: verify each source-specific parser
   and destination/account.
5. Earthquake scheduled jobs and Rally publications: verify thresholds,
   deduplication, and multi-network routing.
6. Runtime dispatch: add focused tests for slash cooldown/permission routing,
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
