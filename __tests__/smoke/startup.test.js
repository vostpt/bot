const fs = require('fs');
const path = require('path');

describe('offline application smoke tests', () => {
  test('core API, service, and job modules load without starting the bot', () => {
    expect(() => require('../../src/api')).not.toThrow();
    expect(() => require('../../src/services')).not.toThrow();
    expect(() => require('../../src/jobs')).not.toThrow();
  });

  test('active social adapters expose their publication contracts', () => {
    const Twitter = require('../../src/services/Twitter');
    const Mastodon = require('../../src/services/Mastodon');
    const Facebook = require('../../src/services/Facebook');
    const Telegram = require('../../src/services/Telegram');
    const Bluesky = require('../../src/services/Bsky');

    expect(Twitter.uploadThreadTwitter).toEqual(expect.any(Function));
    expect(Mastodon.sendPostMastodon).toEqual(expect.any(Function));
    expect(Facebook.postMessageFacebook).toEqual(expect.any(Function));
    expect(Telegram.sendMessagesTelegram).toEqual(expect.any(Function));
    expect(Bluesky.sendPostsToBsky).toEqual(expect.any(Function));
  });

  test('the environment template documents deployment and live smoke controls', () => {
    const template = fs.readFileSync(path.resolve('.env.example'), 'utf8');
    const requiredVariables = [
      'BOT_TOKEN',
      'CLIENT_ID',
      'GUILD_ID',
      'LIVE_SMOKE_TESTS',
      'LIVE_SMOKE_TARGETS',
    ];

    requiredVariables.forEach((variable) => {
      expect(template).toMatch(new RegExp(`^${variable}=`, 'm'));
    });
  });
});
