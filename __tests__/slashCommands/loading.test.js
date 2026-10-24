const fs = require('fs');
const path = require('path');

const disabledCommands = new Set(['corona']);

describe('slash command modules', () => {
  test('all enabled commands produce valid Discord registration data', () => {
    const commandPath = path.resolve(__dirname, '../../src/slashCommands');
    const files = fs.readdirSync(commandPath)
      .filter((file) => file.endsWith('.js'))
      .filter((file) => !disabledCommands.has(path.basename(file, '.js').toLowerCase()));

    const names = files.map((file) => {
      const command = require(path.join(commandPath, file));
      return command.data.toJSON().name;
    });

    expect(names).not.toContain('corona');
    expect(new Set(names).size).toBe(names.length);
    expect(names).toEqual(expect.arrayContaining([
      'acronimo',
      'alerts',
      'all',
      'debug',
      'op',
      'rcm',
      'sismos',
      'sns24',
      'stats',
      'vost',
      'weather',
    ]));
  });
});
