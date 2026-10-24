const fs = require('fs');
const os = require('os');
const path = require('path');

const {
  isDryRun,
  recordPublication,
  sanitize,
} = require('../../src/helpers/publicationLog');
const { getChannel } = require('../../src/services/Discord');

describe('shadow publication log', () => {
  const originalMode = process.env.PUBLISH_MODE;
  const originalLogFile = process.env.PUBLISH_LOG_FILE;
  let directory;
  let logFile;

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'vost-shadow-'));
    logFile = path.join(directory, 'publications.jsonl');
    process.env.PUBLISH_MODE = 'dry-run';
    process.env.PUBLISH_LOG_FILE = logFile;
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
  });

  test('recognizes dry-run and shadow modes', () => {
    expect(isDryRun()).toBe(true);
    process.env.PUBLISH_MODE = 'shadow';
    expect(isDryRun()).toBe(true);
    process.env.PUBLISH_MODE = 'live';
    expect(isDryRun()).toBe(false);
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
