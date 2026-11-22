# AGENTS.md

## Regras obrigatórias

- **Manter os testes e os comentários existentes.** Não remover testes nem comentários que não estejam relacionados com `!chat` ou `!agents`.
- Apenas os testes e comentários específicos do trabalho de `!chat` e `!agents` foram removidos; não os reintroduzir por "boa prática".
- A infraestrutura de testes (Jest, `jest.config.js`, `test/`, `__mocks__/`, `nock`, script `test` e job de cobertura no CI) faz parte do repositório e deve permanecer.

## Como validar alterações

- `node --check <ficheiro.js>` para sintaxe.
- `npx eslint <ficheiros>` para lint.
- `npx jest` para os testes mantidos.
- Execução manual do bot (`LLM_CHAT_ONLY=true npm start`) e chamadas `curl` às APIs para validar comportamento.

## Contexto do projeto

Bot Discord da VOSTPTia em Node.js/CommonJS. Entrada em `src/app.js`, comandos em `src/commands/`, serviços e APIs em `src/services/` e `src/api/`, ferramentas UTCP em `src/services/llm/utcp/`, documentação RAG em `rag/`. Usar português de Portugal na documentação e nas respostas do bot.

## Deterministic Simulation Testing (DST) Rules

When designing, implementing, or refactoring distributed components, state machines, or storage/network code, enforce strict determinism so all execution paths can be replayed via a single-threaded simulation loop.

### 1. Prohibited Sources of Nondeterminism
Never call non-deterministic system APIs directly inside core domain or protocol logic:
- **Wall Clock / System Time:** Do NOT use `System.currentTimeMillis()`, `System.nanoTime()`, `Instant.now()`, `Date.now()`, `time.Now()`, or `std::time::SystemTime`. Always read logical time or ticks from an injected `Clock` / `TimeSource` abstraction.
- **Unseeded Randomness:** Do NOT instantiate unseeded random generators (`new Random()`, `Math.random()`, `rand::thread_rng()`). Always accept a seeded PRNG instance passed down from the simulation harness.
- **Unordered Iteration:** Do NOT iterate over hash-based collections with randomized or undefined iteration order (`HashMap`, `HashSet`, Go `map`). Use order-preserving or sorted structures (`LinkedHashMap`, `TreeMap`, sorted slices) whenever iteration order affects state transitions, message generation, or serialization.
- **Raw Threads & Blocking Sleep:** Do NOT spawn unmanaged background threads (`new Thread()`, `Executors`, `go func()`, `tokio::spawn`) or call `Thread.sleep()` / `time.Sleep()` in protocol logic. Model concurrency as non-blocking state machines, callbacks/futures, and explicit tick-scheduled timers.
- **Direct Network & Disk I/O:** Do NOT open raw sockets, HTTP clients, or direct file descriptors (`java.io.File`, `os.Open`) inside core logic. Route all messaging and persistence through injectable `Network` / `Transport` and `Storage` / `FileSystem` interfaces.

### 2. Required Architecture Patterns
- **Explicit Progress (Tick-Driven):** Design protocol handlers to advance only in response to discrete events: incoming messages, timer ticks, or storage completion callbacks.
- **Boundary Isolation:** Keep serialization/deserialization cleanly separated from transport so tests can simulate both message-level faults (drops, delays, reordering, partitions) and storage faults (slow `fsync`, partial writes, silent corruption, crash recovery).
- **Non-Blocking Futures / Callbacks:** Represent asynchronous disk flushes and RPCs as non-blocking operations that resolve only when the scheduler/simulator explicitly completes them.

### 3. Testing & Correctness Standards
- **Test Correctness, Not Just Availability:** Assert client-visible consistency invariants (e.g., linearizability, quorum read/write semantics, no stale reads after acknowledged writes) rather than merely checking that nodes recover or respond without errors.
- **Simulate Gray Failures:** In simulation tests, inject asymmetric partitions, selective packet drops, clock drift, slow WAL flushes, and process pauses—not just clean node crashes.
- **Seeded Reproducibility:** Every randomized simulation test MUST log its PRNG seed on failure and accept a seed parameter so any failing execution trace can be deterministically reproduced and debugged step-by-step.
