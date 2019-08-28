# VOSTPT Discord bot

[![Build Status](https://travis-ci.com/vostpt/bot.svg?branch=master)](https://travis-ci.com/vostpt/bot)
[![Coverage Status](https://coveralls.io/repos/github/vostpt/bot/badge.svg?branch=master)](https://coveralls.io/github/vostpt/bot?branch=master)

## Installation
Before anything else, install the dependencies:
```sh
yarn install
```

or for those who prefer `npm`:
```sh
npm install
```

## Configuration
After installing the dependencies, it's time for a quick configuration.

Create a `.env` file in the project root.

```sh
cp .env.example .env
```

Add and replace values where needed:

```
#
# Discord bot token
#
BOT_TOKEN=

#
# The channels to where messages should be sent
#
MAIN_CHANNEL_ID=
EARTHQUAKES_CHANNEL_ID=
FIRES_CHANNEL_ID=
WARNINGS_CHANNEL_ID=
TRIGGERS_CHANNEL_ID=

#
# Twitter configurations
#
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=
```

## Running
If you went through the previous steps successfully, you should now be able to run **VOSTPT Discord bot** with the following command:

```sh
npm start
```

You should see an output similar to this:
```sh
READY :: Bot started @ 2019-4-14 21:27:00
```

That's it!
