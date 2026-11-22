# Plano 00 — Contrato do `!chat`

## Objetivo (uma coisa)

Definir o contrato da nova capacidade de chat LLM: o que é, o que não é, e o que acontece em caso de sucesso ou erro. Este plano não implementa código; fixa as regras que todos os outros planos seguem.

## Decisões fixadas

- Idioma dos planos e do bot: **português de Portugal**.
- Local: `plan/NN-slug.md`; um plano por ficheiro; cada plano faz uma coisa.
- Entrada: **`!chat <pergunta>`**.
- Objetivo: o agente escolhe **UTCP tools** e responde com base nos dados acessíveis.
- Primeira versão: **read-only**. Nenhuma ferramenta de escrita, publicação ou comando restrito.
- Histórico:
  - fogos: **não há dados históricos**; responder que não estão disponíveis;
  - DRE: responder apenas com o que estiver disponível recentemente; não inventar dias antigos.
- Memória: histórico curto por utilizador/canal, com TTL.
- Arquitetura: **um único agente orquestrador**; agentes especializados só se necessário no futuro.
- Orçamento do OpenRouter: se a chamada principal falhar com 402/créditos insuficientes, tentar uma vez um modelo gratuito configurável (`LLM_FALLBACK_MODEL`); se falhar, aplicar a regra de erro abaixo.
- Erro: qualquer erro do provider, tool, validação ou orquestração produz exatamente:

```text
Infelizmente não te posso responder
```

- Esta é a regra atual e está alinhada com `docs/llm-chat-report.md`.
- UTCP: usar só os plugins necessários — `@utcp/sdk`, `@utcp/direct-call`, `@utcp/http`, `@utcp/text`, `@utcp/file` e `@utcp/dotenv-loader`.
- Cada plano termina com critérios de aceitação e verificação.

## O que é alterado

- É **adicionado** um novo comando `!chat`.
- São adicionados ficheiros novos em `src/services/llm/`, `src/services/llm/utcp/`, `src/commands/` e `__tests__/`.
- É feita uma adição isolada em `config/bot.js` para as novas variáveis do chat, sem alterar as existentes.

## O que NÃO é alterado

- Nenhum comando existente (`!all`, `!corona`, `!op`, etc.).
- Nenhum trigger em `src/triggers/`.
- Nenhuma reação, DM, menção ao bot ou comportamento de `?commands`.
- Nenhum job em `src/jobs/index.js`.
- Nenhuma publicação em Twitter, Facebook, Mastodon, Telegram ou Bluesky.
- Nenhuma API de escrita, spreadsheet, FTP ou webhook.

## Contrato de entrada

```text
!chat Onde há fogo agora?
!chat Que fogos houve faz 3 semanas e que diários da republica sairam nesses dias
```

O texto após `!chat` é a pergunta. Não há aliases nesta primeira versão.

## Contrato de saída

- **Sucesso:** resposta curta em português, com fontes/timestamps quando disponíveis.
- **Sem dados:** frase explícita dizendo que não há dados para o período pedido; nunca inventar.
- **Erro:** `Infelizmente não te posso responder`.
- Sem reações automáticas.

## Exemplo de honestidade sobre dados

Para a pergunta:

```text
Que fogos houve faz 3 semanas e que diários da republica sairam nesses dias
```

A resposta correta deve dizer, em substância:

```text
Não tenho dados históricos de fogos para esse período. Quanto aos Diários da República, só tenho acesso aos documentos recentes disponíveis neste momento.
```

## Dependências entre planos

```text
00 -> 01 -> 01b -> 02 -> 03 -> 04 -> 05 -> 06 -> 07 -> 08 -> 09
```

- 01 fornece o provider LLM.
- 01b fornece o fallback para modelo gratuito em caso de 402.
- 02 fornece o cliente/manuais UTCP.
- 03 e 04 fornecem as ferramentas.
- 05 fornece interpretação temporal e limites de dados.
- 06 orquestra.
- 07 expõe no Discord.
- 08 acrescenta memória curta.
- 09 valida tudo.

## Critérios de aceitação

- [ ] `!chat` é o único novo comando em Discord.
- [ ] Nenhum ficheiro existente de comando, trigger ou job é modificado.
- [ ] A resposta de erro é exatamente a frase definida.
- [ ] O agente usa apenas tools UTCP read-only.
- [ ] O agente não inventa dados históricos.

## Verificação

- Revisar a lista de ficheiros alterados: apenas ficheiros novos.
- Confirmar que `git diff` não contém alterações em `src/commands/*.js` existentes, `src/triggers/*.js` ou `src/jobs/index.js`.
- Executar `git diff --check`.
