# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/2.0.0/).
Release numbers should follow [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added

- Discord guild slash commands for alerts, occurrences, fire risk, weather,
  earthquakes, operational summaries, diagnostics, help, preparedness guidance,
  emergency contacts, SNS24 information, and team utilities.
- Slash-command deployment and removal commands using `CLIENT_ID` and `GUILD_ID`.
- IPMA RCM fire-risk data parsing and generated map attachments.
- Shadow publishing with an isolated SQLite database, console previews, and JSONL
  publication logs.
- Global, per-network, and per-profile social publishing switches.
- Individual switches for scheduled jobs while preserving existing defaults.
- Optional critical-error alerts to the Discord channel configured through
  `ERRORS_CHANNEL_ID`.
- Read-only, explicitly enabled live connectivity checks for configured social
  services.
- Offline startup, adapter, service, command, webhook, and end-to-end workflow
  test coverage.
- English and Portuguese guides for testing, shadow mode, and workflow
  validation.

### Changed

- The supported runtime is now Node.js 20 or 22.
- Discord integration now uses `discord.js` v14, gateway intents,
  `messageCreate`, and interaction handlers.
- Migrated operational prefix commands are loaded as slash commands; remaining
  prefix commands and message triggers continue to work.
- Twitter publishing now uses `twitter-api-v2` instead of `twit`.
- Social destinations publish independently so one failed network does not
  block successful destinations.
- Twitter and Bluesky now propagate API and partial batch failures to workflow
  reporting.
- COVID report publishing now awaits Twitter, Telegram, Mastodon, and Facebook.
- Scheduled workflows share guarded execution and critical-error reporting.
- Fire-risk publication now builds the current map from IPMA RCM source data.
- IPMA warnings, earthquakes, weather, fires, journal, rally, travel, Medea,
  MeteoAlarm, wind, Facebook, Telegram, Mastodon, Bluesky, and Discord adapters
  were updated for the new runtime and publishing behavior.
- Message triggers now stop after handling a message and use Discord v14 embeds
  and mention APIs.
- Jest, Sequelize, SQLite, and associated development tooling were upgraded.

### Removed

- The obsolete `twit` and `npx` package dependencies.
- Corona polling from the default production schedule.
- Loading of migrated prefix-command handlers.

### Fixed

- One rejected social publication no longer prevents other networks from
  receiving the same workflow output.
- Rally user and role configuration now reads the correct environment values.
- IPMA warning parsing now returns a consistent empty collection on malformed or
  unavailable source data.
- Discord v14 channel lookup, message replies, attachments, and command cooldown
  handling.
- Duplicate noticeable-earthquake notifications within the same day.
- Social publication errors that were previously logged or swallowed are now
  surfaced to the shared workflow and alert reporting paths.
- The Copernicus webhook no longer accepts `Bearer undefined`; when its secret
  is absent, only the webhook is disabled and the Discord bot continues running.

### Security

- Copernicus request authorization headers are no longer logged.
- Critical-error alerts redact common secret, token, password, authorization,
  and cookie fields and suppress Discord mentions.
- Error-reporting failures are contained to prevent recursive alerts.
- Common `.env` backup and environment-specific filenames are ignored while
  `.env.example` remains tracked.

## Maintaining this changelog

- Add user-visible or operator-visible changes under `Unreleased` in the same
  pull request as the change.
- Use the standard `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, and
  `Security` headings, omitting empty headings.
- When releasing, rename `Unreleased` to `[MAJOR.MINOR.PATCH] - YYYY-MM-DD`, add
  a new empty `Unreleased` section above it, and create the matching Git tag.
- Describe outcomes and migration requirements rather than copying commit
  messages or listing every modified file.
