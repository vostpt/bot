const { printAliases } = require('../../src/helpers');

describe('printAliases helper', () => {
  test('with aliases', async () => {
    const aliases = ['a', 'b'];

    expect(await printAliases(aliases)).toMatch(/!a|!b/);
  });

  test('without aliases', async () => {
    expect(await printAliases()).toBe('');
  });
});
