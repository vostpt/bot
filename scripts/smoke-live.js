require('dotenv').config();

const axios = require('axios');
const { getTwitterClient } = require('../src/services/Twitter');
const { mastodonKeys } = require('../config/mastodon');

const enabled = process.env.LIVE_SMOKE_TESTS === 'true';
const requestedTargets = new Set(
  (process.env.LIVE_SMOKE_TARGETS || '')
    .split(',')
    .map((target) => target.trim().toLowerCase())
    .filter(Boolean),
);

const request = axios.create({ timeout: 10000 });

const checks = [
  {
    name: 'discord',
    configured: () => Boolean(process.env.BOT_TOKEN),
    run: async () => {
      const response = await request.get('https://discord.com/api/v10/users/@me', {
        headers: { Authorization: `Bot ${process.env.BOT_TOKEN}` },
      });
      return response.data.username;
    },
  },
  {
    name: 'twitter',
    configured: () => [
      process.env.TWITTER_CONSUMER_KEY,
      process.env.TWITTER_CONSUMER_SECRET,
      process.env.TWITTER_ACCESS_TOKEN_KEY,
      process.env.TWITTER_ACCESS_TOKEN_SECRET,
    ].every(Boolean),
    run: async () => {
      const response = await getTwitterClient('main').v2.me();
      return response.data.username;
    },
  },
  {
    name: 'mastodon',
    configured: () => Boolean(mastodonKeys.main.access_token),
    run: async () => {
      const response = await request.get(`${mastodonKeys.main.api_url}/v1/accounts/verify_credentials`, {
        headers: { Authorization: `Bearer ${mastodonKeys.main.access_token}` },
      });
      return response.data.username || response.data.acct;
    },
  },
  {
    name: 'facebook',
    configured: () => Boolean(process.env.FACEBOOK_TOKEN_VOSTPT),
    run: async () => {
      const response = await request.get('https://graph.facebook.com/me', {
        params: {
          access_token: process.env.FACEBOOK_TOKEN_VOSTPT,
          fields: 'id,name',
        },
      });
      return response.data.name;
    },
  },
  {
    name: 'telegram',
    configured: () => Boolean(process.env.TELEGRAM_API_KEY),
    run: async () => {
      const response = await request.get(`https://api.telegram.org/bot${process.env.TELEGRAM_API_KEY}/getMe`);
      if (!response.data.ok) throw new Error('Telegram getMe returned ok=false');
      return response.data.result.username;
    },
  },
  {
    name: 'bluesky',
    configured: () => Boolean(process.env.BSKY_HANDLE && process.env.BSKY_PASS),
    run: async () => {
      const response = await request.post('https://bsky.social/xrpc/com.atproto.server.createSession', {
        identifier: process.env.BSKY_HANDLE,
        password: process.env.BSKY_PASS,
      });
      return response.data.handle;
    },
  },
];

const describeError = (error) => {
  const status = error.response?.status;
  return status ? `HTTP ${status}: ${error.message}` : error.message;
};

const main = async () => {
  if (!enabled) {
    throw new Error('Refusing live checks. Set LIVE_SMOKE_TESTS=true to enable read-only API authentication.');
  }

  const unknownTargets = [...requestedTargets]
    .filter((target) => !checks.some((check) => check.name === target));
  if (unknownTargets.length) {
    throw new Error(`Unknown LIVE_SMOKE_TARGETS: ${unknownTargets.join(', ')}`);
  }

  const selected = checks.filter((check) => (
    requestedTargets.size ? requestedTargets.has(check.name) : check.configured()
  ));
  if (!selected.length) {
    throw new Error('No live smoke targets are configured or selected.');
  }

  const missing = selected.filter((check) => !check.configured()).map((check) => check.name);
  if (missing.length) {
    throw new Error(`Missing credentials for live smoke targets: ${missing.join(', ')}`);
  }

  const results = await Promise.allSettled(selected.map((check) => check.run()));
  let failed = false;

  results.forEach((result, index) => {
    const { name } = selected[index];
    if (result.status === 'fulfilled') {
      console.log(`[smoke] ${name}: OK (${result.value || 'authenticated'})`);
      return;
    }

    failed = true;
    console.error(`[smoke] ${name}: FAILED (${describeError(result.reason)})`);
  });

  if (failed) process.exitCode = 1;
};

main().catch((error) => {
  console.error(`[smoke] ${describeError(error)}`);
  process.exitCode = 1;
});
