# Plano 01 — Configuração e adapter OpenRouter

## Objetivo (uma coisa)

Criar a configuração do LLM e o adapter do OpenRouter, com uma interface interna simples e provider-agnóstica. Nenhuma chamada Discord, UTCP ou ferramenta entra neste plano.

## Ficheiros a criar

```text
config/llm.js
src/services/llm/providers/openrouter.js
src/services/llm/index.js
src/app.js                                  (alteração: arranque com dotenv-expand)
__tests__/services/llm/provider.test.js
```

O projeto já usa `dotenv@7`. Adicionar `dotenv-expand@5.1.0`, compatível com essa versão, para permitir referências `${VAR}` no `.env`.

## Variáveis de ambiente

```dotenv
OPENROUTER_TOKEN=
LLM_PROVIDER=openrouter
LLM_API_KEY=${OPENROUTER_TOKEN}
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=
LLM_MAX_TOKENS=1200
LLM_TEMPERATURE=0.3
LLM_TIMEOUT_MS=20000
```

- `LLM_PROVIDER` permite adicionar outro provider sem mudar comandos.
- `LLM_API_KEY` é a chave de **chat** do OpenRouter e usa `LLM_API_KEY=${OPENROUTER_TOKEN}`.
- `OPENROUTER_TOKEN` pode existir no ambiente global; `dotenv-expand` resolve a referência sem duplicar o valor.
- Não existe verificação de créditos/saldo.
- Não existe management key.

## Interface interna

```js
// src/services/llm/index.js
async function chat({ messages, tools = [] }) -> string
```

- `messages`: array de mensagens no formato OpenAI-compatible (`system`, `user`, `assistant`, `tool`).
- `tools`: opcional; define ferramentas no formato que o provider aceitar.
- Retorna apenas o texto da resposta final.
- Lança `LlmProviderError` em qualquer falha.

## Adapter OpenRouter

- Usar o pacote `openai` com `baseURL = LLM_BASE_URL`.
- Enviar `Authorization: Bearer ${LLM_API_KEY}`.
- Enviar opcionalmente `HTTP-Referer` e `X-Title` se configurados.
- Aplicar `LLM_TIMEOUT_MS` e `LLM_MAX_TOKENS`.
- Normalizar erros 401/402/429/5xx/timeout/JSON inválido para `LlmProviderError`, preservando o código para o plano 01b poder identificar 402.
- Não enviar mensagens de erro ao Discord; isso é responsabilidade do plano 07.

## Regras

- O arranque em `src/app.js` deve usar `dotenvExpand(dotenv.config())` com a API da versão 5.
- Nenhuma lógica de persona, tools, parsing de datas ou Discord neste plano.
- O único retry permitido é o fallback do plano 01b, exclusivamente para 402/créditos insuficientes.
- Nenhum log com o valor da API key.
- O provider é selecionado por `LLM_PROVIDER`; só `openrouter` é implementado agora.

## Critérios de aceitação

- [ ] `chat({ messages })` funciona com resposta mockada do OpenRouter.
- [ ] Falha do provider gera `LlmProviderError` com código preservado.
- [ ] Erro 402 é distinguido de 401/429/5xx para o plano 01b.
- [ ] Nenhuma variável de crédito/management key aparece no código.
- [ ] Referências `${VAR}` no `.env` são expandidas no arranque.
- [ ] `LLM_API_KEY=${OPENROUTER_TOKEN}` funciona com `OPENROUTER_TOKEN` exportado no ambiente.
- [ ] Nenhuma mensagem Discord é enviada por este plano.
- [ ] A chave nunca aparece em logs ou mensagens.

## Verificação

- Teste de arranque com `OPENROUTER_TOKEN` definido no ambiente e `LLM_API_KEY=${OPENROUTER_TOKEN}` no `.env`.
- Teste unitário com `nock` interceptando `POST /chat/completions`.
- Teste de erro 401 e timeout.
- `git diff --check`.
- Confirmar que `config/llm.js` não lê `BOT_TOKEN` nem outras credenciais do bot.
