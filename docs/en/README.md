# VOSTPT Bot

This project runs the VOSTPT Discord bot and its scheduled information feeds to
social networks.

## Requirements and installation

Use Node.js 20 or 22. Install dependencies with:

```sh
npm ci
```

Create local configuration from the template:

```bash
cp .env.example .env
```

Fill in credentials and channel IDs for the services you want to use. The full
list and scheduled-job switches are in `.env.example`. Keep real secrets out of
Git.

## Run the bot

Apply the local development database migrations, then start the bot:

```sh
npx sequelize-cli db:migrate --env development
npm start
```

Slash commands are registered to the guild configured by `CLIENT_ID` and
`GUILD_ID`:

```sh
npm run commands:deploy
```

The Discord application needs the Message Content intent enabled for triggers
and the remaining prefix commands. Corona is excluded from slash registration.

## Preview posts safely

To fetch current upstream data and print the publications that would be made,
use [Shadow mode](./shadow-mode.md). It uses an isolated SQLite database and
logs planned Discord, Twitter/X, Mastodon, Facebook, Telegram, and Bluesky
outputs instead of publishing them.

```sh
npm run shadow
npm run shadow -- warnings weather
npm run shadow:watch
```

## Tests

Run the full automated test suite:

```sh
npm test -- --runInBand
```

Run the offline startup and adapter smoke tests:

```sh
npm run test:smoke
```

Optional live smoke tests authenticate with selected APIs but do not publish
posts. Enable them explicitly and choose targets as needed:

```sh
LIVE_SMOKE_TESTS=true LIVE_SMOKE_TARGETS=discord,twitter,telegram npm run test:smoke:live
```

Run lint checks:

```sh
npm run lint -- src/ config/ scripts/
```

See [Shadow mode](./shadow-mode.md) and [Testing](./testing.md) for details.
