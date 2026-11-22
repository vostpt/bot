# Plano 07 — Novo comando `!chat`

## Objetivo (uma coisa)

Adicionar o único novo ponto de entrada Discord: `!chat <pergunta>`. Este plano liga o comando ao orquestrador e trata a resposta de erro. Não altera nenhum comando existente.

## Ficheiros a criar / alterar

```text
src/commands/chat.js                 (novo)
config/bot.js                        (adição de config, sem alterar comportamento existente)
__tests__/commands/chat.test.js      (novo)
```

## Definição do comando

```js
module.exports = {
  name: 'chat',
  active: true,
  args: true,
  cooldown,
  usage: '**!chat <pergunta>** - Faz uma pergunta ao VOSTPTia com dados acessíveis via UTCP.',
  async execute(message, args) { ... }
};
```

- Sem aliases nesta versão.
- Usa o `cooldown` já existente em `config/bot.js`.
- Sem reações automáticas.
- Resposta enviada por `sendMessageAnswer` / `sendMessageToChannel`, respeitando o limite de 1950 caracteres.

## Configuração nova

```dotenv
LLM_CHAT_ENABLED=true
LLM_ALLOWED_CHANNELS=
```

- `LLM_CHAT_ENABLED=false` mantém o comando registado mas desativado.
- `LLM_ALLOWED_CHANNELS` vazio = todos os canais; se preenchido, lista de IDs separados por vírgula.
- Implementar em `config/bot.js` como `llmChatEnabled` e `llmChatChannels`, sem alterar `prefix`, `channels`, `cooldown`, `userLists` ou `roleLists`.

## Fluxo

1. Receber `args` e juntar com espaço.
2. Se não houver pergunta, enviar a frase de erro definida abaixo.
3. Obter histórico curto do plano 08.
4. Resolver contexto temporal do plano 05.
5. Chamar `orchestrator.runChat(...)`.
6. Enviar `answer` com `sendMessageAnswer`.
7. Guardar turno na memória do plano 08.

## Erro

O fallback por falta de orçamento do OpenRouter é tratado antes deste ponto, no plano 01b. Se o fallback falhar ou não estiver configurado, então, em qualquer erro do orquestrador, provider, tool, validação ou memória crítica, enviar exatamente:

```js
`Infelizmente não te posso responder`
```

- Enviar com `sendMessageToChannel(message.channel, text)`.
- Não usar `message.reply`, para não duplicar menção.
- Não enviar stack trace, detalhe técnico, reação ou DM.

## Compatibilidade

- `src/app.js` já carrega automaticamente ficheiros de `src/commands/`.
- `src/events/message.js` já aplica `active`, aliases, cooldown e canais.
- Não alterar `?commands`; a listagem passa a incluir `!chat` apenas porque o loader já funciona assim.

## Critérios de aceitação

- [ ] `!chat Onde há fogo agora?` responde com dados e fonte.
- [ ] Falha do provider envia exatamente a frase de erro definida.
- [ ] Falha de tool e ausência de pergunta enviam exatamente a mesma frase.
- [ ] Nenhuma reação é adicionada.
- [ ] Nenhum comando/trigger/job existente é modificado.
- [ ] `LLM_CHAT_ENABLED=false` desativa apenas o novo comando.

## Verificação

- Teste do comando com orquestrador mockado.
- Teste da frase de erro exata.
- Teste de ausência de args.
- Teste de canais permitidos.
- Teste de regressão: `?commands`, `!all`, menção ao bot e triggers continuam iguais.
- `git diff --check`.
