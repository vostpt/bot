const memory = require('../../../src/services/llm/memory');

const T0 = new Date('2026-03-25T12:00:00.000Z').getTime();

beforeEach(() => {
  memory.resetMemory();
});

describe('memória curta do chat', () => {
  test('mantém o histórico dentro de 15 minutos', () => {
    const key = memory.buildKey('canal-1', 'user-1');

    memory.append(key, 'user', 'Onde há fogo?', T0);
    memory.append(key, 'assistant', 'Há ocorrências em Lisboa.', T0 + 1000);

    expect(memory.getHistory(key, T0 + 14 * 60 * 1000)).toHaveLength(2);
  });

  test('descarta o histórico após o TTL desde o último acesso', () => {
    const key = memory.buildKey('canal-1', 'user-1');

    memory.append(key, 'user', 'Pergunta antiga', T0);
    expect(memory.getHistory(key, T0 + 14 * 60 * 1000)).toHaveLength(1);

    memory.append(key, 'user', 'Pergunta recente', T0 + 14 * 60 * 1000);
    expect(memory.getHistory(key, T0 + 29 * 60 * 1000)).toHaveLength(0);
  });

  test('no máximo 10 turnos, removendo os mais antigos', () => {
    const key = memory.buildKey('canal-1', 'user-1');

    for (let i = 0; i < 15; i += 1) {
      memory.append(key, 'user', `Mensagem ${i}`, T0 + i);
    }

    const history = memory.getHistory(key, T0 + 15);

    expect(history).toHaveLength(memory.MAX_TURNS);
    expect(history[0].content).toBe('Mensagem 5');
    expect(history[9].content).toBe('Mensagem 14');
  });

  test('isola conversas por canal e utilizador', () => {
    memory.append(memory.buildKey('canal-1', 'user-1'), 'user', 'A', T0);
    memory.append(memory.buildKey('canal-2', 'user-1'), 'user', 'B', T0);
    memory.append(memory.buildKey('canal-1', 'user-2'), 'user', 'C', T0);

    expect(memory.getHistory(memory.buildKey('canal-1', 'user-1'), T0)[0].content).toBe('A');
    expect(memory.getHistory(memory.buildKey('canal-2', 'user-1'), T0)[0].content).toBe('B');
    expect(memory.getHistory(memory.buildKey('canal-1', 'user-2'), T0)[0].content).toBe('C');
  });

  test('getHistory devolve cópia e limita mensagens a 2000 caracteres', () => {
    const key = memory.buildKey('canal-1', 'user-1');
    const longText = 'x'.repeat(2500);

    memory.append(key, 'user', longText, T0);
    const history = memory.getHistory(key, T0);

    expect(history[0].content).toHaveLength(2000);
    history[0].content = 'alterado';
    expect(memory.getHistory(key, T0)[0].content).toHaveLength(2000);
  });

  test('clear e clearExpired removem apenas o que deve ser removido', () => {
    const old = memory.buildKey('canal-1', 'user-1');
    const recent = memory.buildKey('canal-2', 'user-2');

    memory.append(old, 'user', 'Antiga', T0);
    memory.append(recent, 'user', 'Recente', T0 + 19 * 60 * 1000);
    memory.clearExpired(T0 + 20 * 60 * 1000);

    expect(memory.getHistory(old, T0 + 20 * 60 * 1000)).toEqual([]);
    expect(memory.getHistory(recent, T0 + 20 * 60 * 1000)).toHaveLength(1);

    memory.clear(recent);
    expect(memory.getHistory(recent, T0 + 20 * 60 * 1000)).toEqual([]);
  });
});
