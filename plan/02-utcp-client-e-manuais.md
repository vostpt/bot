# Plano 02 — Cliente UTCP e convenção de manuais

## Objetivo (uma coisa)

Criar o cliente UTCP único e a convenção de manuais/tools. Este plano não implementa as ferramentas de negócio; apenas prepara a base para que todos os planos seguintes usem UTCP da mesma forma.

## Bibliotecas

Instalar apenas:

```text
@utcp/sdk
@utcp/direct-call
@utcp/http
@utcp/text
@utcp/file
@utcp/dotenv-loader
```

Não instalar nesta fase: `@utcp/cli`, `@utcp/mcp`, `@utcp/code-mode`.

Nota: usar `@utcp/sdk`, não `@utcp/core`. Os pacotes UTCP publicam builds CommonJS/ESM; validar `require()` em Node/Jest antes de avançar.

## Ficheiros a criar

```text
src/services/llm/utcp/client.js
src/services/llm/utcp/manuals/index.js
src/services/llm/utcp/manuals/vost.json
src/services/llm/utcp/allowlist.js
__tests__/services/llm/utcp.test.js
```

## Convenção de nomes

Todas as tools usam o prefixo `vost_` e o formato `manual.tool`:

```text
vost_prociv.get_all
vost_fires.get_important
vost_ipma.get_current_warnings
vost_journal.get_recent
```

## Contrato do cliente

```js
const utcp = require('./services/llm/utcp/client');

await utcp.searchTools('fogo');
await utcp.callTool('vost_prociv.get_all', { limit: 10 });
```

- `UtcpClient.create()` é chamado uma vez por processo.
- Plugins são importados explicitamente para registo.
- Variáveis `${VAR}` nos manuais são resolvidas via `@utcp/dotenv-loader`.
- `searchTools` e `callTool` são as únicas formas de acesso a ferramentas pelo agente.
- `callTool` verifica a allowlist antes de executar.

## Allowlist

- Array explícito de nomes de tools permitidos ao chat.
- Qualquer tool nova só entra depois de adicionada aqui.
- Tools de escrita/publicação ficam **fora** da allowlist nesta entrega.

## Manual `vost.json`

- `manual_version` e `utcp_version` válidos.
- Cada tool com:
  - `name`;
  - `description`;
  - `inputs` com JSON Schema;
  - `tags` para pesquisa (`fogo`, `tempo`, `dre`, `sns`, etc.);
  - `tool_call_template` com `call_template_type: direct-call` ou `http`.
- Nenhuma credencial escrita no manual; apenas `${VAR}`.

## Segurança

- URLs HTTPS em produção; loopback só em desenvolvimento.
- Nenhuma tool com `POST`, `PUT`, `PATCH` ou `DELETE` é exposta.
- Nenhuma tool recebe tokens do Discord, Twitter, Telegram, Mastodon, FTP ou Google como argumento.
- Erros de descoberta/chamada são lançados para o plano 06 tratar.

## Critérios de aceitação

- [ ] Cliente inicializa em CommonJS sem erro.
- [ ] `searchTools('fogo')` encontra tools de fogo quando existirem.
- [ ] `callTool` rejeita tool fora da allowlist.
- [ ] Nenhuma tool de escrita está registada.
- [ ] Nenhuma credencial aparece no manual.

## Verificação

- Teste unitário de inicialização do cliente.
- Teste de allowlist: tool permitida vs tool bloqueada.
- Teste de resolução `${VAR}` sem expor valor.
- `git diff --check`.
