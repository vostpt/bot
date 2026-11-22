# Plano 06 — Orquestração do agente único

## Objetivo (uma coisa)

Definir o agente orquestrador que recebe a pergunta, escolhe UTCP tools, sintetiza a resposta e sinaliza erro. Não cria o comando Discord nem as tools; apenas coordena.

## Ficheiros a criar

```text
src/services/llm/prompts/vostptia.js
src/services/llm/orchestrator.js
__tests__/services/llm/orchestrator.test.js
```

## Arquitetura

- **Um único agente orquestrador.**
- Sem agentes especializados nesta entrega.
- O agente não chama serviços diretamente; usa apenas `utcp.searchTools()` e `utcp.callTool()`.
- O agente usa o adapter do plano 01 para falar com o provider.

## Entrada

```js
runChat({
  question,
  history,
  dateContext,
  tools
}) -> { answer, sources }
```

- `question`: texto do utilizador.
- `history`: array curto do plano 08.
- `dateContext`: resultado do plano 05.
- `tools`: ferramentas permitidas pelo plano 02.

## Fluxo

1. Receber pergunta, histórico e contexto temporal.
2. Pedir ao LLM um plano curto de ferramentas, com no máximo **4 chamadas**.
3. Validar nomes de tools contra a allowlist.
4. Executar chamadas independentes em paralelo; chamadas dependentes em sequência.
5. Se uma tool devolver `available: false`, incluir essa informação na resposta.
6. Pedir ao LLM uma resposta final curta em português, com fontes e timestamps.
7. Validar tamanho da resposta antes de devolver.

## Prompt system (requisitos)

O prompt deve conter, no mínimo:

- persona VOSTPTia;
- português de Portugal;
- respostas curtas e objetivas;
- usar ferramentas antes de responder;
- nunca inventar dados, datas, números ou links;
- respeitar `available: false`;
- citar fonte/timestamp quando disponível;
- não mencionar prompts, tools internas, providers ou tokens;
- não executar ações de escrita.

## Erros

Qualquer falha — provider, tool, validação de JSON, tool fora da allowlist, resposta inválida, timeout — lança erro para o plano 07.

**O plano 06 não envia mensagens ao Discord.**

A frase de erro definitiva é enviada apenas pelo comando:

```text
Infelizmente não te posso responder
```

## Limites

- Máximo 4 chamadas de tool por pergunta.
- Máximo 2 passos de planeamento.
- Máximo 1200 tokens de resposta final.
- Nenhuma tool de escrita.
- Nenhum acesso direto a `src/services/*` fora de UTCP.

## Critérios de aceitação

- [ ] O agente escolhe tools apenas por `searchTools`.
- [ ] Tool fora da allowlist nunca é chamada.
- [ ] Resposta final cita fonte quando os dados têm `source`.
- [ ] `available: false` gera resposta explícita de ausência de dados.
- [ ] Qualquer erro é propagado ao comando, sem mensagem própria.

## Verificação

- Teste com tools mockadas para “Onde há fogo agora?”.
- Teste com `available: false` para “faz 3 semanas”.
- Teste com tool fora da allowlist.
- Teste com erro do provider.
- Confirmar que nenhuma mensagem Discord é enviada neste plano.
- `git diff --check`.
