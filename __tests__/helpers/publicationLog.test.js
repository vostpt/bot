const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  isDryRun,
  areSocialPostsEnabled,
  skipSocialPost,
  recordPublication,
  sanitize,
} = require('../../src/helpers/publicationLog');
const { getChannel } = require('../../src/services/Discord');

describe('shadow publication log', () => {
  const originalMode = process.env.PUBLISH_MODE;
  const originalLogFile = process.env.PUBLISH_LOG_FILE;
  const originalSocialPostsEnabled = process.env.SOCIAL_POSTS_ENABLED;
  let directory;
  let logFile;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-shadow-'));
    logFile = path.join(directory, 'publications.jsonl');
    process.env.PUBLISH_MODE = 'dry-run';
    process.env.PUBLISH_LOG_FILE = logFile;
    process.env.SOCIAL_POSTS_ENABLED = 'true';
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    fs.rmSync(directory, { recursive: true, force: true });
  });

  afterAll(() => {
    if (originalMode === undefined) delete process.env.PUBLISH_MODE;
    else process.env.PUBLISH_MODE = originalMode;

    if (originalLogFile === undefined) delete process.env.PUBLISH_LOG_FILE;
    else process.env.PUBLISH_LOG_FILE = originalLogFile;

    if (originalSocialPostsEnabled === undefined) delete process.env.SOCIAL_POSTS_ENABLED;
    else process.env.SOCIAL_POSTS_ENABLED = originalSocialPostsEnabled;
  });

  test('recognizes dry-run and shadow modes', () => {
    expect(isDryRun()).toBe(true);
    process.env.PUBLISH_MODE = 'shadow';
    expect(isDryRun()).toBe(true);
    process.env.PUBLISH_MODE = 'live';
    expect(isDryRun()).toBe(false);
  });

  test('keeps social publishing enabled by default and supports an explicit off switch', () => {
    delete process.env.SOCIAL_POSTS_ENABLED;
    expect(areSocialPostsEnabled()).toBe(true);
    process.env.SOCIAL_POSTS_ENABLED = 'false';
    expect(areSocialPostsEnabled()).toBe(false);
    expect(skipSocialPost('Facebook')).toBe(true);
    process.env.SOCIAL_POSTS_ENABLED = 'true';
    expect(skipSocialPost('Facebook')).toBe(false);
  });

  test('supports network and account/profile switches independently', () => {
    const flagNames = [
      'SOCIAL_POSTS_ENABLED', 'SOCIAL_TWITTER_ENABLED',
      'SOCIAL_FACEBOOK_ENABLED', 'SOCIAL_FACEBOOK_MAIN_ENABLED',
      'SOCIAL_FACEBOOK_RALLY_ENABLED',
      'SOCIAL_INSTAGRAM_ENABLED', 'SOCIAL_INSTAGRAM_MAIN_ENABLED',
    ];
    const originalValues = Object.fromEntries(flagNames.map((name) => [name, process.env[name]]));

    try {
      Object.keys(originalValues).forEach((name) => delete process.env[name]);
      process.env.SOCIAL_TWITTER_ENABLED = 'false';
      process.env.SOCIAL_FACEBOOK_RALLY_ENABLED = 'false';
      process.env.SOCIAL_INSTAGRAM_MAIN_ENABLED = 'false';

      expect(areSocialPostsEnabled('TWITTER', 'main')).toBe(false);
      expect(areSocialPostsEnabled('FACEBOOK', 'main')).toBe(true);
      expect(areSocialPostsEnabled('FACEBOOK', 'rally')).toBe(false);
      expect(areSocialPostsEnabled('INSTAGRAM', 'main')).toBe(false);
      process.env.SOCIAL_FACEBOOK_ENABLED = 'false';
      expect(areSocialPostsEnabled('FACEBOOK', 'main')).toBe(false);
    } finally {
      Object.entries(originalValues).forEach(([name, value]) => {
        if (value === undefined) delete process.env[name];
        else process.env[name] = value;
      });
    }
  });

  test('writes a structured JSON line without serializing binary media', () => {
    const result = recordPublication('facebook', {
      account: 'main',
      message: 'Aviso laranja',
      media: Buffer.from('image'),
    });
    const entries = fs.readFileSync(logFile, 'utf8').trim().split('\n').map(JSON.parse);

    expect(result.dryRun).toBe(true);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({
      mode: 'dry-run',
      destination: 'facebook',
      payload: {
        account: 'main',
        message: 'Aviso laranja',
        media: '<Buffer 5 bytes>',
      },
    });
  });

  test('summarizes oversized strings', () => {
    expect(sanitize('x'.repeat(10001))).toMatch(/^<Long string 10001 characters;/);
  });

  test('represents a missing Discord channel in shadow mode', async () => {
    await expect(getChannel(null, undefined)).resolves.toEqual({
      id: 'unconfigured',
      name: 'shadow-unconfigured',
    });
  });
});
