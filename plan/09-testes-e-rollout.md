# Plano 09 — Testes, aceitação e rollout

## Objetivo (uma coisa)

Validar que o `!chat` funciona como planeado e que nada do bot existente mudou. Não introduz nova funcionalidade.

## Ficheiros a criar / atualizar

```text
__tests__/services/llm/provider.test.js
__tests__/services/llm/utcp.test.js
__tests__/services/llm/utcp/tools.test.js
__tests__/services/llm/utcp/http.test.js
__tests__/services/llm/time.test.js
__tests__/services/llm/orchestrator.test.js
__tests__/services/llm/memory.test.js
__tests__/commands/chat.test.js
```

## Regras de teste

- Nenhuma chamada real ao OpenRouter.
- Nenhuma chamada real a APIs externas.
- `nock` para HTTP; mocks para UTCP tools e serviços.
- Relógico falso para datas e TTL.
- Nenhum teste usa credenciais reais.

## Cenários de aceitação

### 1. Fogo agora

```text
!chat Onde há fogo agora?
```

Esperado:
- usa `vost_prociv.get_all` e/ou `vost_fires.get_important`;
- responde com ocorrências atuais;
- inclui fonte ou timestamp;
- não inventa ocorrências.

### 2. Histórico e DRE

```text
!chat Que fogos houve faz 3 semanas e que diarios da republica sairam nesses dias
```

Esperado:
- resolve `faz 3 semanas`;
- recebe `available: false` da ferramenta de fogos;
- não inventa fogos antigos;
- diz que só tem documentos DRE recentes;
- não cria novo job nem arquivo.

### 3. Erro do provider

- Mock: OpenRouter devolve 401/429/500/timeout.
- Esperado: exatamente `Infelizmente não te posso responder`.
- Sem stack trace, sem reação, sem DM.

### 4. Erro de tool UTCP e pergunta vazia

- Mock: `callTool` lança erro; comando chamado sem argumentos.
- Esperado: a mesma frase de erro em ambos os casos.

### 5. Tool fora da allowlist

- Agente tenta chamar tool de escrita.
- Esperado: bloqueio e frase de erro; nunca executa.

### 6. Memória

- Duas perguntas correlacionadas no mesmo canal/user dentro de 15 minutos.
- Esperado: segunda pergunta usa histórico da primeira.
- Após TTL, histórico descartado.

### 7. Fallback por orçamento

- Mock: primeira chamada ao modelo principal devolve 402; segunda chamada ao modelo gratuito devolve 200.
- Esperado: resposta normal, uma única repetição, detalhe apenas em log.
- Teste adicional: fallback também falha → `Infelizmente não te posso responder`.
- Teste adicional: `LLM_FALLBACK_MODEL` vazio → sem segunda chamada.

### 8. Regressão

- `?commands`, `!all`, `!sismos`, menção ao bot e triggers continuam com resposta idêntica.
- Nenhum job é modificado.
- Nenhum ficheiro existente de comando/trigger é alterado.

## Rollout

- `LLM_CHAT_ENABLED=false` por omissão até validação.
- Ativar primeiro num canal de voluntários via `LLM_ALLOWED_CHANNELS`.
- Só abrir a mais canais depois de validar custo, latência e qualidade das respostas.
- Documentar no README apenas se o utilizador pedir; este plano não altera documentação existente.

## Verificação final

```sh
npm test
npm run lint
git diff --check
git status --short
```

## Critérios de aceitação globais

- [ ] Todos os testes passam.
- [ ] Nenhuma API real é chamada nos testes.
- [ ] Nenhum comando, trigger, reação ou job existente foi modificado.
- [ ] `!chat` é o único novo comando.
- [ ] Fallback 402 usa o modelo gratuito uma vez quando configurado.
- [ ] A frase de erro é exata em todos os cenários de falha.
- [ ] Nenhuma ferramenta de escrita é acessível ao agente.
