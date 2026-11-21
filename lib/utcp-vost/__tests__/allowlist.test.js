const { isAllowed, ALLOWED_TOOLS } = require('../src/allowlist');

describe('allowlist', () => {
  test('ALLOWED_TOOLS é um array congelado', () => {
    expect(Array.isArray(ALLOWED_TOOLS)).toBe(true);
    expect(Object.isFrozen(ALLOWED_TOOLS)).toBe(true);
  });

  test('isAllowed devolve true para tools permitidas', () => {
    expect(isAllowed('vost_prociv.get_all')).toBe(true);
    expect(isAllowed('vost_http.acronym_lookup')).toBe(true);
  });

  test('isAllowed devolve false para tools desconhecidas', () => {
    expect(isAllowed('vost_unknown.tool')).toBe(false);
    expect(isAllowed('')).toBe(false);
  });

  test('isAllowed devolve false para inputs não-string', () => {
    expect(isAllowed(null)).toBe(false);
    expect(isAllowed(123)).toBe(false);
    expect(isAllowed(undefined)).toBe(false);
  });
});
