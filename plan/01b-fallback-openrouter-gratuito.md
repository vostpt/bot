# Plano 01b — Fallback para modelo gratuito do OpenRouter

## Objetivo (uma coisa)

Quando o OpenRouter recusar o pedido por falta de orçamento, repetir **uma única vez** com um modelo gratuito configurável. Nenhuma outra falha dispara fallback.

## Ficheiros a alterar

```text
config/llm.js
src/services/llm/providers/openrouter.js
__tests__/services/llm/provider.test.js
.env.example
```

## Variáveis de ambiente

```dotenv
LLM_FALLBACK_ENABLED=true
LLM_FALLBACK_MODEL=
LLM_FALLBACK_MAX_ATTEMPTS=1
```

- `LLM_FALLBACK_MODEL` é obrigatório quando `LLM_FALLBACK_ENABLED=true`.
- O valor deve ser um ID de modelo gratuito válido no OpenRouter.
- Não é definido um modelo fixo no código: modelos gratuitos e a sua disponibilidade mudam.
- Se `LLM_FALLBACK_MODEL` estiver vazio, o fallback fica desativado e a falha 402 segue para a mensagem de erro normal.

## Deteção da falha

O fallback só é ativado quando a resposta do OpenRouter indicar erro de orçamento:

- HTTP **402 Payment Required**; ou
- corpo da resposta com código/mensagem equivalente a `insufficient credits`, `insufficient balance` ou `payment required`.

Não disparam fallback:

- 401 (chave inválida);
- 429 (rate limit);
- 5xx;
- timeout;
- JSON inválido;
- erro de tool;
- erro de validação.

## Fluxo

1. Chamar o modelo principal `LLM_MODEL`.
2. Se responder bem, devolver a resposta normalmente.
3. Se falhar com erro de orçamento:
   - verificar `LLM_FALLBACK_ENABLED` e `LLM_FALLBACK_MODEL`;
   - registar em log interno: `budget_exhausted`, modelo principal, modelo fallback;
   - repetir o **mesmo** `messages` e `tools` com `model = LLM_FALLBACK_MODEL`;
   - usar `LLM_FALLBACK_MAX_ATTEMPTS=1`.
4. Se o fallback responder bem, devolver essa resposta como se nada tivesse acontecido.
5. Se o fallback falhar, lançar `LlmProviderError` para o plano 07 enviar:

```text
Infelizmente não te posso responder
```

## Regras

- Sem verificação prévia de créditos; não existe management key.
- Sem consulta ao endpoint `/credits`.
- Sem loop infinito: máximo uma tentativa de fallback.
- Sem mudança de prompt, ferramentas, temperatura ou limite de tokens entre tentativas.
- O utilizador não é informado de que houve fallback.
- O detalhe do fallback fica apenas em logs internos.
- O adapter continua provider-agnóstico: este plano é específico do OpenRouter, mas a interface `chat()` não muda.

## Considerações sobre ferramentas

- O modelo gratuito escolhido deve suportar o mesmo formato de tool calling usado pelo agente.
- Se o modelo gratuito não suportar tools, o fallback falhará e o bot enviará a mensagem de erro padrão.
- Validar esta compatibilidade antes de ativar o fallback em produção.

## Critérios de aceitação

- [ ] Erro 402 do modelo principal dispara fallback quando configurado.
- [ ] Mensagens equivalentes de crédito insuficiente também disparam fallback.
- [ ] 401, 429, 5xx e timeout **não** disparam fallback.
- [ ] Apenas uma tentativa de fallback.
- [ ] Falha do fallback gera `LlmProviderError`.
- [ ] Nenhuma mensagem de fallback é enviada ao Discord.
- [ ] Nenhuma credencial aparece em logs.

## Verificação

- Teste com `nock`: primeira chamada 402, segunda chamada 200 com modelo gratuito.
- Teste com primeira chamada 401: sem segunda chamada.
- Teste com primeira chamada 429: sem segunda chamada.
- Teste com fallback também em falha: erro final.
- Teste com `LLM_FALLBACK_MODEL` vazio: sem segunda chamada.
- `git diff --check`.
