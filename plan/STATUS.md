# STATUS — Estado dos planos do `!chat`

Este ficheiro acompanha o progresso da implementação da funcionalidade `!chat` com LLM e UTCP.

## Estado geral

| Item | Estado |
|---|---|
| Planos escritos | **11/11** |
| Planos implementados | **11/11** |
| Funcionalidade `!chat` testável | **Sim** (com `LLM_CHAT_ENABLED=true`) |
| Guia de teste | `DEV.md` pronto; cenários automatizados validados |

**Resumo:** todos os planos implementados e verificados: provider OpenRouter com fallback 402, cliente/manuais UTCP, tools read-only e HTTP, datas em `Europe/Lisbon`, memória curta, agente único, comando `!chat` e validação final. `npm test`: 20 suítes / 123 testes. Sem commits e sem alteração a `.env`; os ficheiros de comandos/triggers/jobs existentes foram preservados, mas o modo `LLM_CHAT_ONLY=true` desativa-os em runtime. O rollout em canal de teste depende do utilizador.

## Legenda

| Símbolo | Significado |
|---|---|
| ⬜ | Por implementar |
| 🔄 | Em implementação |
| ✅ | Implementado e verificado |
| ⛔ | Bloqueado |
| ℹ️ | Documento/contrato pronto, sem código de runtime |

## Estado por plano

| # | Plano | Estado | O que falta | Dependência |
|---|---|---|---|---|
| 00 | [`00-contrato-chat.md`](./00-contrato-chat.md) | ℹ️ | Nada; é o contrato das decisões | Nenhuma |
| 01 | [`01-config-openrouter.md`](./01-config-openrouter.md) | ✅ | Nada; concluído e verificado | 00 |
| 01b | [`01b-fallback-openrouter-gratuito.md`](./01b-fallback-openrouter-gratuito.md) | ✅ | Nada; concluído e verificado | 01 |
| 02 | [`02-utcp-client-e-manuais.md`](./02-utcp-client-e-manuais.md) | ✅ | Nada; concluído e verificado | 01 |
| 03 | [`03-tools-leitura-vost.md`](./03-tools-leitura-vost.md) | ✅ | Nada; concluído e verificado | 02 |
| 04 | [`04-tools-http-externas.md`](./04-tools-http-externas.md) | ✅ | Nada; concluído e verificado | 02 |
| 05 | [`05-contexto-temporal-e-historico.md`](./05-contexto-temporal-e-historico.md) | ✅ | Nada; concluído e verificado | 02 |
| 06 | [`06-orquestracao-agente.md`](./06-orquestracao-agente.md) | ✅ | Nada; concluído e verificado | 01, 02, 03, 04, 05 |
| 07 | [`07-comando-chat-discord.md`](./07-comando-chat-discord.md) | ✅ | Nada; concluído e verificado | 06, 08 |
| 08 | [`08-memoria-conversa.md`](./08-memoria-conversa.md) | ✅ | Nada; concluído e verificado (antecipado, dependência do 07) | Nenhuma |
| 09 | [`09-testes-e-rollout.md`](./09-testes-e-rollout.md) | ✅ | Nada do lado do código; ativação em canal de teste é operacional | 01–08 e 01b |

## Checklist de implementação

### Plano 01 — Config e OpenRouter

- [x] `config/llm.js` criado
- [x] `src/services/llm/providers/openrouter.js` criado
- [x] `src/services/llm/index.js` criado
- [x] `dotenv-expand@5.1.0` instalado e usado em `src/app.js`
- [x] `LLM_API_KEY=${OPENROUTER_TOKEN}` validado
- [x] Erros normalizados sem mensagens automáticas ao Discord

### Plano 01b — Fallback gratuito

- [x] `LLM_FALLBACK_ENABLED`, `LLM_FALLBACK_MODEL` e `LLM_FALLBACK_MAX_ATTEMPTS` adicionados
- [x] Erro 402 dispara fallback
- [x] 401/429/5xx não disparam fallback
- [x] Falha do fallback gera erro padrão
- [x] Testes com mock do provider

### Plano 02 — UTCP

- [x] Dependências UTCP instaladas e fixadas
- [x] `src/services/llm/utcp/client.js` criado
- [x] Manuais criados
- [x] Allowlist criada
- [x] Carregamento CommonJS validado

### Plano 03 — Tools `direct-call`

- [x] Tools read-only registadas
- [x] Nenhuma tool de escrita exposta
- [x] Serviços existentes não alterados
- [x] Testes dos wrappers

### Plano 04 — Tools HTTP

- [x] Tools HTTP registadas
- [x] Apenas `GET`
- [x] Sem credenciais nos manuais
- [x] Testes com `nock`

### Plano 05 — Tempo e histórico

- [x] Datas relativas resolvidas
- [x] `faz 3 semanas` tratado como sem dados históricos de fogos
- [x] DRE limitado a documentos recentes
- [x] Testes com relógio falso (data fixa injetada)

### Plano 06 — Agente

- [x] Prompt versionado
- [x] Orquestrador único implementado
- [x] Tools validadas pela allowlist
- [x] Erro propagado ao comando

### Plano 07 — Comando

- [x] `src/commands/chat.js` criado
- [x] `LLM_CHAT_ENABLED` e `LLM_ALLOWED_CHANNELS` adicionados
- [x] Erro exato: `Infelizmente não te posso responder`
- [x] Nenhum comando existente alterado

### Plano 08 — Memória

- [x] TTL de 15 minutos
- [x] Máximo 10 turnos
- [x] Chave por `channelId:authorId`
- [x] Testes de expiração

### Plano 09 — Testes e rollout

- [x] `npm test` (19 suítes, 119 testes)
- [x] `npx eslint <ficheiros alterados>` (o `npm run lint` não tem argumentos em `package.json`)
- [x] `git diff --check`
- [x] Cenários de aceitação do `DEV.md` validados com mocks
- [x] Rollout preparado: `LLM_CHAT_ENABLED=false` por omissão e `LLM_ALLOWED_CHANNELS` vazio; ativação em canal de teste a fazer pelo utilizador

## Como atualizar este ficheiro

Ao concluir um plano:

1. Mudar o estado na tabela de `⬜` para `✅`.
2. Marcar os checkboxes correspondentes.
3. Atualizar o estado geral.
4. Registar o commit/PR na secção abaixo.
5. Só marcar como `✅` quando os critérios de aceitação e verificação do plano estiverem cumpridos.

## Histórico

| Data | Plano | Estado | Commit/PR | Notas |
|---|---|---|---|---|
| — | — | — | — | Estado inicial: documentos criados, código por implementar |
| 01 | Config e OpenRouter | ✅ | Sem commit (conforme pedido) | `chat()`, adapter `openai`, erros `LlmProviderError`, 9 testes com `nock`; sem chamadas reais |
| 01b | Fallback gratuito | ✅ | Sem commit (conforme pedido) | Repetição única em 402/créditos; detalhe apenas em log; sem consulta a `/credits` |
| 02 | Cliente UTCP | ✅ | Sem commit (conforme pedido) | Cliente único, 11 manuais registados, allowlist explícita de 20 tools; sem escrita |
| 03 | Tools `direct-call` | ✅ | Sem commit (conforme pedido) | 15 wrappers read-only, normalização com fonte/timestamp, limite 10/50; sem publicar |
| 04 | Tools HTTP | ✅ | Sem commit (conforme pedido) | 5 tools `GET`, URL com argumento substituído, erros HTTP propagados com `nock` |
| 05 | Tempo e histórico | ✅ | Sem commit (conforme pedido) | `resolveDateRange()` em Lisboa; fogos passados devolvem `available: false`; 8 testes |
| 08 | Memória curta | ✅ | Sem commit (conforme pedido) | TTL 15 min, 10 turnos, 2000 caracteres, isolamento por canal/user; 6 testes |
| 06 | Agente único | ✅ | Sem commit (conforme pedido) | Prompt v1.0.0, máx. 4 tools e 2 passos, allowlist antes de executar; 10 testes |
| 07 | Comando `!chat` | ✅ | Sem commit (conforme pedido) | Comando isolado, sem aliases/reações, erro exato via `sendMessageToChannel`; 9 testes |
| 09 | Testes e rollout | ✅ | Sem commit (conforme pedido) | 19 suítes / 119 testes, ESLint e `git diff --check` limpos; regressão de mensagens com 4 testes; nenhuma API real chamada |
| — | Correções de arranque | — | Sem commit (conforme pedido) | A pedido do utilizador: `Twitter.js` e `Bsky.js` toleram credenciais ausentes sem chamadas de rede; `server.js` não derruba o bot se a porta 3000 estiver ocupada; migrações SQLite executadas; bot arrancado com `PORT=3001` |
| — | Modo apenas `!chat` | — | Sem commit (conforme pedido) | Nova flag `LLM_CHAT_ONLY=true`: outros comandos, `?commands`, menções, triggers e jobs desativados sem apagar ficheiros; para reverter, remover a flag. 4 testes de regressão |
| — | Input local no painel | — | Sem commit (conforme pedido) | Flag `LLM_CHAT_LOCAL_INPUT=true` abre `chat>` no terminal; texto simples vira `!chat <texto>`; `exit` fecha o input, `quit`/Ctrl+C param o bot. Usa o primeiro ID de `LLM_ALLOWED_CHANNELS` para não ser ignorado pelo filtro de canal; log `Command_to_ignore` removido. 4 testes |
| — | Ajuste ao modelo de raciocínio | — | Sem commit (conforme pedido) | `tencent/hy4-flash` é válido; `tencent/hya4-flash` não existe. Com 20 tools no prompt o modelo esgotava 1200 tokens em raciocínio e devolvia conteúdo vazio; passou a enviar 8 tools compactas e 1800/1600 tokens no planeamento/resposta. Resumos compactos das tools e retry em `EMPTY_RESPONSE` (mais tokens, depois resumo mínimo). Validado com perguntas reais no painel, incluindo "What can you access" |
| — | Mensagem de arranque | — | Sem commit (conforme pedido) | No `ready`, o bot envia `Estou aqui` ao canal principal configurado ou ao primeiro canal de texto com permissão de escrita; falha é registada sem impedir o arranque. 4 testes; validado no painel (#general) |
| — | Log de mensagens recebidas | — | Sem commit (conforme pedido) | `src/events/message.js` regista `[DISCORD-MESSAGE]`/`[LOCAL-MESSAGE]` com canal, autor e conteúdo truncado, além de `emitLog('discord.message.received')`; validado no painel |
| — | Telemetria silenciosa | — | Sem commit (conforme pedido) | `initTelemetry()` exige `OTEL_ENABLED=true` além do endpoint; endpoint herdado do harness deixa de iniciar SDK e de gerar erros de exportação; documentado em `docs/observability.md` |
| — | Menção no erro do `!chat` | — | Sem commit (conforme pedido) | A frase `Infelizmente não te posso responder` passou a ser precedida de `<@user_id>` no Discord (`@local` no painel); continua sem `message.reply` e sem detalhes técnicos |

## Regras para marcar como concluído

Um plano só passa a `✅` se:

- os ficheiros previstos existirem;
- os testes do plano passarem;
- `git diff --check` não reportar erros;
- nenhum comando, trigger, reação ou job existente tiver sido alterado;
- a funcionalidade não expuser ferramentas de escrita;
- a mensagem de erro for exatamente `Infelizmente não te posso responder`.
