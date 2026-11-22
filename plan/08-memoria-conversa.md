# Plano 08 — Memória curta do `!chat`

## Objetivo (uma coisa)

Adicionar memória conversacional curta por utilizador/canal, sem persistência e sem alterar o comportamento do resto do bot.

## Ficheiros a criar

```text
src/services/llm/memory.js
__tests__/services/llm/memory.test.js
```

## Decisão

- Memória **em memória**, não persistida em SQLite.
- Chave: `${channelId}:${authorId}`.
- TTL: **15 minutos** desde o último acesso.
- Máximo: **10 turnos** por conversa.
- Cada turno: `{ role: 'user'|'assistant', content, createdAt }`.
- Limite: 2000 caracteres por mensagem guardada.
- Ao exceder o limite, remover os turnos mais antigos.

## Interface

```js
memory.getHistory(key) -> Array
memory.append(key, role, content) -> void
memory.clear(key) -> void
memory.clearExpired() -> void
```

- `getHistory` devolve cópia; nunca devolve referência interna mutável.
- `clearExpired` é chamado no início de cada `getHistory`/`append`.
- Não guardar tokens, segredos, IDs internos de provider nem stack traces.

## Integração

- O comando do plano 07 usa `getHistory` antes de chamar o orquestrador.
- Depois de resposta bem-sucedida, usa `append` para `user` e `assistant`.
- Em caso de erro, **não** guardar o turno.
- Falha de memória é não crítica: registar log e seguir sem histórico.

## Critérios de aceitação

- [ ] Conversa com o mesmo user/canal dentro de 15 minutos mantém contexto.
- [ ] Após 15 minutos, histórico é descartado.
- [ ] Nunca passa de 10 turnos.
- [ ] Reiniciar o bot limpa toda a memória.
- [ ] Nenhuma informação sensível é guardada.
- [ ] Nenhum comando existente é afetado.

## Verificação

- Teste unitário com relógio falso (`fake timers`).
- Teste de limite de turnos.
- Teste de chave distinta por user/canal.
- Teste de `getHistory` devolvendo cópia.
- `git diff --check`.
