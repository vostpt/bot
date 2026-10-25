# Testing and checks

Run commands from the repository root with Node.js 20 or 22 installed.

## Full automated test suite

```sh
npm test -- --runInBand
```

This runs unit tests and offline integration smoke tests. External services are
mocked; the suite does not publish posts.

## Offline smoke tests

```sh
npm run test:smoke
```

These check that core API, service, and job modules load and verify the main
social adapter contracts using mocks.

## Optional live authentication checks

Live checks make read-only authentication or identity requests. They do not
create posts. The explicit `LIVE_SMOKE_TESTS=true` gate is required:

```sh
LIVE_SMOKE_TESTS=true npm run test:smoke:live
```

To check selected services only:

```sh
LIVE_SMOKE_TESTS=true LIVE_SMOKE_TARGETS=discord,twitter,mastodon npm run test:smoke:live
```

Supported target names are `discord`, `twitter`, `mastodon`, `facebook`,
`telegram`, and `bluesky`. With no target list, the runner checks configured
services. If a requested target has no credentials, the run fails and names the
missing target.

## Lint

```sh
npm run lint -- src/ config/ scripts/
```

The current lint setup reports existing console logging as warnings; lint exits
with an error only for lint errors.

## Preview publications

Use [Shadow mode](./shadow-mode.md) to run real message construction over live
source data while logging planned outbound messages instead of posting them.
