# VOSTPT Discord bot

[![Build Status](https://travis-ci.com/vostpt/bot.svg?branch=master)](https://travis-ci.com/vostpt/bot)
[![Coverage Status](https://coveralls.io/repos/github/vostpt/bot/badge.svg?branch=master)](https://coveralls.io/github/vostpt/bot?branch=master)

# Installation
Before anything else, install the dependencies:
```sh
yarn install
```

or for those who prefer `npm`:
```sh
npm install
```

# Configuration
After installing the dependencies, it's time for a quick configuration.

Create a `.env` file in the project root.

```sh
cp .env.example .env
```

Create the database directory and execute Sequelize migrations:

```bash
mkdir ./data
npx sequelize-cli db:migrate --env ENVIRONMENT
```

ENVIRONMENT: development | test | production

Add and replace values where needed:

```
#
# Discord bot token
#
BOT_TOKEN=

#
# Cooldown interval in seconds
#
COOLDOWN=30

#
# The channels to where messages should be sent
#
MAIN_CHANNEL_ID=
EARTHQUAKES_CHANNEL_ID=
FIRES_CHANNEL_ID=
WARNINGS_CHANNEL_ID=
WARNINGS_AZ_CHANNEL_ID=
WARNINGS_MD_CHANNEL_ID=
FUEL_CHANNEL_ID=
TRIGGERS_CHANNEL_ID=
MGMT_CHANNEL_ID=
VOLUNTEERS_CHANNEL_ID=
TWFEED_CHANNEL_ID=
DGSCORONA_CHANNEL_ID=
JOURNAL_CHANNEL_ID=

#
# Discord roles
#

COREROLE=

#
# Discord user permission list
#

CORONAUPDATEUSERS=

#
# Twitter configurations (Main account)
#
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=

#
# Twitter configurations (Azores account)
#
TWITTER_AZ_CONSUMER_KEY=
TWITTER_AZ_CONSUMER_SECRET=
TWITTER_AZ_ACCESS_TOKEN_KEY=
TWITTER_AZ_ACCESS_TOKEN_SECRET=

#
# Twitter configurations (Europe account)
#
TWITTER_EU_CONSUMER_KEY=
TWITTER_EU_CONSUMER_SECRET=
TWITTER_EU_ACCESS_TOKEN_KEY=
TWITTER_EU_ACCESS_TOKEN_SECRET=

#
# Twitter configurations (Journal account)
#
TWITTER_DRE_CONSUMER_KEY=
TWITTER_DRE_CONSUMER_SECRET=
TWITTER_DRE_ACCESS_TOKEN_KEY=
TWITTER_DRE_ACCESS_TOKEN_SECRET=

#
# FTP configuration
#

FTPSERVER=
FTPUSER=
FTPPASSWORD=

#
# DGS resume spreadsheet
#

DGSRESUMESID=
DGSRESUMESGID=

#
# Node environment (for Sequelize)
# test/development/production

NODE_ENV=

#
# Beta mode (run only beta commands, disable all other functions)
# When disabled ('false' or empty), run all but beta commands
#
BETA_MODE=
```

# Running
If you went through the previous steps successfully, you should now be able to run **VOSTPT Discord bot** with the following command:

```sh
npm start
```

You should see an output similar to this:
```sh
READY :: Bot started @ 2019-4-14 21:27:00
```

That's it!
