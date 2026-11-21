const {
  limitOf,
  asArray,
  normalizeResult,
  unavailableResult,
  parseInLisbon,
  isPastRange,
  isPastDate,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  ZONE,
} = require('../../src/tools/context');

describe('tools/context', () => {
  test('limitOf limita valores acima de MAX_LIMIT', () => {
    expect(limitOf(100)).toBe(MAX_LIMIT);
  });

  test('limitOf devolve DEFAULT_LIMIT para valores inválidos', () => {
    expect(limitOf(0)).toBe(DEFAULT_LIMIT);
    expect(limitOf(-1)).toBe(DEFAULT_LIMIT);
    expect(limitOf('abc')).toBe(DEFAULT_LIMIT);
    expect(limitOf(null)).toBe(DEFAULT_LIMIT);
  });

  test('asArray converte valores correctamente', () => {
    expect(asArray([1, 2])).toEqual([1, 2]);
    expect(asArray(null)).toEqual([]);
    expect(asArray('')).toEqual([]);
    expect(asArray(42)).toEqual([42]);
  });

  test('normalizeResult devolve estrutura esperada', () => {
    const result = normalizeResult('test', [1, 2, 3], { limit: 2 });
    expect(result.source).toBe('test');
    expect(result.available).toBe(true);
    expect(result.data).toEqual([1, 2]);
    expect(result.retrievedAt).toMatch(/^\d{4}/);
  });

  test('unavailableResult devolve estrutura esperada', () => {
    const result = unavailableResult('test', 'razão');
    expect(result.available).toBe(false);
    expect(result.reason).toBe('razão');
    expect(result.data).toEqual([]);
  });

  test('parseInLisbon interpreta formatos portugueses', () => {
    const d1 = parseInLisbon('15/03/2024');
    expect(d1.isValid()).toBe(true);

    const d2 = parseInLisbon('15032024');
    expect(d2.isValid()).toBe(true);
  });

  test('isPastRange detecta datas no passado', () => {
    const past = '2020-01-01';
    const future = '2099-12-31';

    expect(isPastRange({ date: past })).toBe(true);
    expect(isPastRange({ date: future })).toBe(false);
    expect(isPastRange({})).toBe(false);
  });

  test('isPastDate delega para isPastRange', () => {
    expect(isPastDate('2020-01-01')).toBe(true);
    expect(isPastDate('2099-12-31')).toBe(false);
  });
});
