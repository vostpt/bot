const { printAliases } = require('../../src/helpers');

describe('printAliases helper', () => {
  test('with aliases', () => {
    const aliases = ['a', 'b'];

    expect(printAliases(aliases)).toMatch(/!a|!b/);
  });

  test('without aliases', () => {
    expect(printAliases()).toBe('');
  });
});
