const moment = require('moment-timezone');

const { resolveDateRange } = require('../../../src/services/llm/time');
const { isPastRange, NO_HISTORY } = require('../../../src/services/llm/utcp/tools/context');

// Fixed clock: 25 de março de 2026, 12:00 UTC (= 12:00 em Lisboa).
const NOW = new Date('2026-03-25T12:00:00.000Z');

describe('resolvedor de datas', () => {
  test('faz 3 semanas resolve exatamente 21 dias, não hoje', () => {
    const range = resolveDateRange('Que fogos houve faz 3 semanas?', NOW);

    expect(range.supported).toBe(true);
    expect(range.label).toBe('há 3 semanas');
    expect(moment(range.end).diff(moment(range.start), 'days')).toBe(21);
    expect(moment(range.start).format('YYYY-MM-DD')).toBe('2026-03-04');
  });

  test('faz N dias e faz N meses usam o fuso de Lisboa', () => {
    const days = resolveDateRange('faz 2 dias', NOW);
    const months = resolveDateRange('faz 1 mês', NOW);

    expect(days.label).toBe('há 2 dias');
    expect(moment(days.end).diff(moment(days.start), 'days')).toBe(2);
    expect(months.label).toBe('há 1 mês');
    expect(moment(months.start).format('YYYY-MM-DD')).toBe('2026-02-25');
    expect(rangeTimezone(days)).toBe('+00:00');
  });

  test('hoje e ontem cobrem o dia completo', () => {
    const today = resolveDateRange('Onde há fogo hoje?', NOW);
    const yesterday = resolveDateRange('E ontem?', NOW);

    expect(today.label).toBe('hoje');
    expect(moment(today.start).format('YYYY-MM-DD')).toBe('2026-03-25');
    expect(yesterday.label).toBe('ontem');
    expect(moment(yesterday.start).format('YYYY-MM-DD')).toBe('2026-03-24');
  });

  test('aceita ISO, DD/MM/AAAA e DDMMMAAAA', () => {
    const cases = [
      ['2026-03-15', '2026-03-15'],
      ['15/03/2026', '2026-03-15'],
      ['15032026', '2026-03-15'],
    ];

    cases.forEach(([text, expected]) => {
      const range = resolveDateRange(`Sismos em ${text}`, NOW);
      expect(range.supported).toBe(true);
      expect(moment(range.start).format('YYYY-MM-DD')).toBe(expected);
    });
  });

  test('datas ambíguas pedem esclarecimento em vez de supor', () => {
    const range = resolveDateRange('faz 3 semanas e 15/03/2026', NOW);

    expect(range.supported).toBe(false);
    expect(range.reason).toMatch(/esclarecimento/);
  });

  test('sem data reconocível devolve supported false', () => {
    const range = resolveDateRange('Como estás?', NOW);

    expect(range.supported).toBe(false);
    expect(range.start).toBeNull();
  });

  test('intervalo passado é sinalizado como sem dados históricos', () => {
    const range = resolveDateRange('faz 3 semanas', NOW);

    expect(isPastRange(range, NOW)).toBe(true);
    expect(NO_HISTORY).toBe('sem dados históricos');
  });

  test('o dia atual nunca é considerado histórico', () => {
    const range = resolveDateRange('hoje', NOW);

    expect(isPastRange(range, NOW)).toBe(false);
  });
});

const rangeTimezone = (range) => range.start.slice(-6);
