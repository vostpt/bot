# Relatório: chat LLM no VOSTPTia

## 1. Resumo executivo

Este relatório responde a quatro perguntas:

1. **Que fontes e APIs o bot já consulta?**
2. **A que comandos, menções e triggers o bot responde?**
3. **Onde introduzir chats ou agentes LLM para processar pedidos e obter informação?**
4. **Que bibliotecas são mais adequadas ao projeto?**

O levantamento foi feito por análise estática de `src/`, `config/`, `package.json`, `README.md` e documentação existente. Não houve alteração de código, dependências ou configuração de runtime.

**Restrição de compatibilidade:** nenhum comando, trigger, reação, job ou interação existente é modificado. A única adição em Discord é um **novo comando de chat** (por exemplo `!chat`), carregado pelo mecanismo atual de `src/commands/`. As menções continuam com a resposta aleatória de hoje, o `?commands` mantém a lógica atual e os comandos `!` existentes não são reescritos.

A recomendação geral é começar com um **gateway de LLM provider-agnóstico** usando OpenRouter como primeiro provider, com duas regras desde o primeiro dia:

1. **Resposta curta em caso de erro**: não existe verificação prévia de créditos/saldo. Se a chamada ao provider ou a uma ferramenta falhar — incluindo falta de créditos, 401/402/429, 5xx, timeout ou resposta inválida — o `!chat` responde exatamente: `Infelizmente não te posso responder`. O detalhe técnico fica apenas nos logs internos.
2. **UTCP para todos os protocolos de ferramentas**: o chat não chama APIs nem funções diretamente. Usa um cliente [UTCP](https://www.utcp.io) com [protocol plugins](https://www.utcp.io/protocols) (`direct-call`, `http`, `streamable-http`, `sse`, `text`, `file`, `cli`, `mcp`), de forma que a mesma camada sirva dados locais, REST, streaming, ficheiros e integrações futuras.

Agentes com permissões de escrita devem ficar para uma fase posterior, com aprovação humana.

---

## 2. Fontes de dados e APIs já usadas

### 2.1 APIs e fontes externas

| Origem                                                  | Como é acedida                                 | Onde está no código                                                                       | Uso principal                                                      |
| ------------------------------------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `https://bot-api.vost.pt`                               | HTTP JSON via `node-fetch` em `src/api/api.js` | `src/api/Prociv.js`, `Fires.js`, `Earthquakes.js`, `Warnings.js`, `Weather.js`, `Wind.js` | Ocorrências ProCiv, incêndios, sismos, avisos, meteorologia, vento |
| `https://api.vost.pt/v1/acronyms/`                      | HTTP JSON                                      | `src/api/Acronyms.js`                                                                     | Definição exata de acrónimos                                       |
| IPMA — página inicial                                   | `axios` + `cheerio` sobre HTML                 | `src/api/Ipma.js`, `src/services/Ipma.js`                                                 | Avisos meteorológicos em Portugal                                  |
| IPMA — mapa de risco de incêndio                        | URL de imagem JPG                              | `src/services/Fires.js`                                                                   | `!rcm hoje` e job diário                                           |
| MeteoAlarm                                              | Feeds Atom legados de ~38 países               | `src/api/MeteoAlarm.js`, `src/services/MeteoAlarm.js`                                     | Avisos laranja/vermelho europeus e posts VOST Europe               |
| DGS / COVID-19                                          | HTML + PDFs                                    | `src/api/Corona.js`, `src/services/Corona.js`                                             | Relatórios de situação, MD5, espelho FTP e notificações            |
| Google Sheets — resumos DGS                             | Feed público e Google Sheets API               | `config/api.js`, `src/api/Corona.js`, `src/services/Corona.js`                            | `!corona resumo`, `!corona update`, notificações                   |
| DRE / Diário da República                               | Feeds RSS Série I e Série II                   | `config/journal.js`, `src/api/Journal.js`, `src/services/Journal.js`                      | Novos decretos e despachos                                         |
| SNS24                                                   | HTML + `cheerio`                               | `src/services/Sns.js`                                                                     | `!sns24 alerts`                                                    |
| Portal das Comunidades (MNE)                            | HTML por país                                  | `src/services/Viajar.js`, `config/countries.js`                                           | Deteção de páginas de conselhos aos viajantes atualizadas          |
| MEDEA                                                   | CSV público do Google Sheets                   | `config/medea.js`, `src/services/Medea.js`                                                | Mensagens públicas do exercício MEDEA                              |
| `raw.githubusercontent.com/vostpt/daily_weather_report` | Download de imagens                            | `src/api/Weather.js`, `src/services/Weather.js`                                           | Extremos diários para PT, Madeira e Açores                         |
| `api.ipify.org`                                         | HTTP JSON                                      | `src/commands/debug.js`                                                                   | IP público no comando de debug                                     |
| Firebase Cloud Function `addMeteo`                      | POST com `X-VOSTWARNINGS`                      | `config/api.js`, `src/api/Warnings.js`                                                    | Envio de avisos para a app VOST                                    |

### 2.2 Serviços de publicação e integrações sociais

| Plataforma | Biblioteca / protocolo | Uso |
|---|---|---|
| Twitter / X | `twitter-api-v2`, uploads v1 | Publicar threads com texto e imagem; conta principal, Açores, DRE, Rally, VOSTPTia e VOST Europe |
| Facebook | `fb` (Graph API) | Ler posts da página VOSTPT e publicar em VOSTPT/Rally |
| Mastodon / Pleroma | `axios` para `https://trombas.vost.pt/api` | Publicar avisos, relatórios, decretos e extremos meteorológicos |
| Telegram | `messaging-api-telegram` | Enviar mensagens, documentos e fotos para canais VOST e Rally |
| Bluesky | AT Protocol via `axios` + `sharp` | Publicar texto e imagens com hashtags e descrição de imagem |
| Discord | `discord.js` v11 | Receber mensagens, enviar respostas, reações, ficheiros e emitir jobs |
| Webhook Copernicus | Express `POST /copernicus` | Receber eventos externos autenticados e enviar para canal Discord |

### 2.3 Estado local

O bot usa SQLite com Sequelize em `src/database/` para evitar duplicados e manter estado:

- `CoronaReports`
- `Decrees`
- `IpmaWarnings`
- `MeteoAlarmWarnings`
- `FbPosts`
- `MedeaMessages`
- `Tweets` (modelo presente; leitura de timeline está desativada/comentada)

Este estado é importante para qualquer agente LLM: as decisões de dedupe e idempotência já existem na camada de serviços e não devem ser reimplementadas no prompt.

---

## 3. Comandos, reações e triggers atuais

Todos os comandos em `src/commands/` estão com `active: true` e usam o prefixo `!`. O cooldown vem de `config/bot.js` (`COOLDOWN`, 10 segundos por omissão).

| Comando | Formas aceites | Função | Notas |
|---|---|---|---|
| `!acronimo` | `!acronimo`, `!acr`, `!acronym` | Procura acrónimo exato | Aliases definidos em `config/commandAliases.js` |
| `!alerts` | `!alerts` | Lista avisos IPMA por região | Usa `Warnings.getAll()` |
| `!all` | `!all`, `!all links`, `!all important`, `!all human N`, `!all ground N`, `!all air N` | Lista ocorrências ProCiv/incêndios, com filtros | Separa ocorrências "relevantes" das normais; resposta por DM e reações |
| `!corona` | `reports`, `resumo <data>`, `update ...`, `notify <URL>` | Relatórios DGS, resumo, atualização e notificação | `update` e `notify` exigem user/role autorizado; `allowedArgs` diz `notificacao`, mas o código implementa `notify` |
| `!debug` | `!debug` | Versões do Node/IP e IP público | Restrito a `MGMT_CHANNEL_ID` |
| `!sismos` | `!sismos dd/mm/aaaa` | Sismos do IPMA para uma data | Separa sismos sentidos dos restantes |
| `!op` | `id`, `ir`, `if`, `status`, `distrito`, `vento` | Consulta ocorrências por ID, localidade, estado, distrito ou vento | Distritos mapeados no próprio comando |
| `!rally` | `upload`, `update`, `info` | Upload CSV, atualização de lotação e envio de informação | Restrito; `info` está implementado mas não aparece em `usage`/`allowedArgs` |
| `!rcm` | `!rcm hoje` | Envia mapa de risco de incêndio | Imagem do IPMA |
| `!sns24` | `!sns24 alerts` | Alertas do SNS24 | Scraping HTML |
| `!stats` | `!stats` | Totais nacionais de ocorrências e meios | Agrega ProCiv por estado |
| `!vost` | `registo`, `rs`, `irmaos` | Links internos, redes sociais e VOST irmãs | `rs` é enviado por DM |
| `!weather` | sem args, `tomorrow`, `extremes` | Previsão do IPMA e extremos diários | Divide respostas longas em blocos de 15 linhas |

### 3.1 Comportamentos fora dos comandos

- `?commands`: envia por DM a lista de `usage` dos comandos ativos e reage com 📧/📥.
- **Menção ao bot**: responde com uma frase aleatória do array em `src/events/message.js`.
- **Ignorados**: `firestatus`, `firemajor`, `firemeans`, `firestats`, `firelocation`, `firenature`, `firetime`, `firepriority`, `firecoverage`, `fireupdate`, `firecoords`, `fireinfo` — evita conflito com outro bot firewatch.
- **Comando desconhecido, desativado ou em cooldown**: resposta por DM ao autor e reação 📧/📥.

### 3.2 Triggers passivos

| Trigger | O que deteta | Onde atua |
|---|---|---|
| `greetings` | Bom dia/boa tarde/boa noite em vários idiomas, com mensagens personalizadas por user ID | `TRIGGERS_CHANNEL_ID`, `VOLUNTEERS_CHANNEL_ID` |
| `football` | `benfica`, `sporting`, `fcp`, `fc porto`, `senhorim`, `scb`, `sc braga` | `TRIGGERS_CHANNEL_ID`, `VOLUNTEERS_CHANNEL_ID` |
| `lousyLanguage` | Palavras ofensivas em português | `TRIGGERS_CHANNEL_ID` |
| `miscellaneous` | `!coffee`, `!champagne`, `!bolo`, `!alheira`, `voluntários`, 💪 | `TRIGGERS_CHANNEL_ID`, `VOLUNTEERS_CHANNEL_ID` |
| `wordReminder` | `aprosoc` | Todos os canais |

---

## 4. Onde introduzir LLM chats ou agentes

O fluxo atual é:

```text
Discord message
  -> src/app.js
  -> src/events/message.js
       -> triggers
       -> ?commands
       -> comandos (!)
            -> src/services/*
                 -> src/api/*
                        -> fontes externas
            -> src/services/Discord.js
                 -> resposta no Discord / DM / ficheiro / reação
```

Pontos de intervenção, com **zero alteração ao comportamento atual**:

1. **Novo `src/commands/chat.js`**  
   Único ponto de entrada Discord do LLM, por exemplo `!chat <texto>`. O `src/app.js` já carrega automaticamente todos os ficheiros de `src/commands/`, e o `src/events/message.js` já aplica aliases, cooldown, canais e `active` sem precisar de mudanças. A listagem `?commands` passa a incluir o novo comando por consequência do loader; nenhum comando existente é afetado.

2. **Novo `src/services/llm/utcp/`**  
   Cliente UTCP único (`UtcpClient.create`, `searchTools`, `callTool`) e manuais que descrevem as ferramentas disponíveis. Nenhuma ferramenta é chamada por `require()` direto a partir do prompt.

3. **Novo `src/services/llm/`**  
   Camada única para:
   - config do provider;
   - adapter OpenRouter;
   - integração com o cliente UTCP;
   - construção de prompts;
   - validação de saída;
   - cache;
   - métricas de custo/latência;
   - erro curto e consistente quando o provider falha: a exceção é registada e o comando envia a frase definida.

4. **`src/services/` como fronteira de ferramentas UTCP**  
   Os serviços já encapsulam regras de negócio, dedupe e publicação. Passam a ser expostos como UTCP tools — primariamente via `@utcp/direct-call` — sem alterar a sua implementação. Um agente chama `utcp.callTool('vost_prociv.get_all', {})`, não reimplementa acesso a APIs.

5. **`src/jobs/index.js` (fora da primeira entrega)**  
   Sumarização e tradução de feeds recorrentes poderiam usar as mesmas UTCP tools, mas isso implicaria alterar jobs existentes e só deve ser feito após aprovação explícita.

---

## 5. Cinco sugestões ordenadas

### Opção 1 — Gateway provider-agnóstico + novo comando de chat

**Ideia:** criar uma camada LLM pequena e isolada, com OpenRouter como primeiro provider, e expor **apenas um novo comando**, por exemplo `!chat <texto>`. As menções e todos os outros comandos/triggers permanecem exatamente como estão.

**Integração:**

- `config/llm.js` lê configuração por ambiente.
- `src/services/llm/providers/openrouter.js` implementa o adapter de chat.
- `src/services/llm/utcp/client.js` cria o `UtcpClient`; nesta fase pode começar sem tools ou com um manual mínimo, mas já estabelece a fronteira UTCP.
- `src/services/llm/index.js` expõe uma API interna como `chat({ messages, maxTokens, temperature })` e deixa propagar erro do provider para o comando.
- `src/commands/chat.js` chama essa API e usa `sendMessageAnswer` / `sendMessageToChannel`.

Variáveis sugeridas:

```dotenv
OPENROUTER_TOKEN=
LLM_PROVIDER=openrouter
LLM_API_KEY=${OPENROUTER_TOKEN}
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=
LLM_MAX_TOKENS=800
LLM_TEMPERATURE=0.4
LLM_TIMEOUT_MS=15000
LLM_FALLBACK_ENABLED=true
LLM_FALLBACK_MODEL=
LLM_FALLBACK_MAX_ATTEMPTS=1
```

**Comportamento perante falhas:**

1. O comando envia o pedido diretamente ao gateway; **não há consulta prévia de saldo, créditos ou endpoint de gestão**.
2. Se o OpenRouter responder 402 ou créditos insuficientes, o plano 01b tenta uma vez o modelo configurado em `LLM_FALLBACK_MODEL`. Se não estiver configurado ou se o fallback falhar, o erro segue para o comando.
3. Outras falhas — 401, 429, 5xx, timeout ou JSON inválido — não disparam fallback. Nesses casos, o gateway lança o erro e o `src/commands/chat.js` trata-o internamente.
4. **O bot responde exatamente:** `Infelizmente não te posso responder`. Não há resposta genérica nem reação.
5. O detalhe do erro e do fallback pode ser registado nos logs do processo para diagnóstico, mas nunca é enviado para o canal ou DM.
6. Este comportamento é exclusivo do novo `!chat`; os comandos e triggers existentes mantêm o tratamento de erro que já têm.

O fallback por falta de orçamento está detalhado em `plan/01b-fallback-openrouter-gratuito.md`. O ID do modelo gratuito é configurável e não é fixo no código.

Para não repetir a chave em vários sítios, o arranque usa `dotenv-expand`: `LLM_API_KEY=${OPENROUTER_TOKEN}` resolve a partir de `OPENROUTER_TOKEN` definido no próprio `.env` ou no ambiente global.

OpenRouter é OpenAI-compatible, pelo que o SDK `openai` pode apontar `baseURL` para `https://openrouter.ai/api/v1`. Cabeçalhos como `HTTP-Referer` e `X-Title` podem ser enviados pelo adapter.

**Vantagens:** menor risco, baixo acoplamento, fácil de testar e desligar; respetar o limite de 1950 caracteres já implementado em `src/services/Discord.js`; falha do provider é comunicada com uma frase curta e consistente.

**Contras:** o modelo ainda não sabe dados em tempo real do bot; respostas são apenas conversacionais.

**Esforço:** baixo. **Recomendação:** ponto de partida.

---

### Opção 2 — Router de intenção com saída estruturada

**Ideia:** usar o LLM apenas para perceber o que o utilizador quer, não para executar ações. O modelo devolve JSON como:

```json
{
  "intent": "fire_status",
  "command": "all",
  "args": ["important"],
  "confidence": 0.91
}
```

**Integração:**

- Validar a saída com `zod` ou `ajv`.
- Mapear `intent` para uma UTCP tool já registada; a execução passa sempre por `UtcpClient.callTool`, nunca por chamada direta a partir do prompt.
- Se `confidence` for baixa ou faltarem argumentos, pedir esclarecimento.
- O novo comando continua a beneficiar do pipeline de `message.js`: cooldown, canal, permissões, `active`. Nenhum comando existente é alterado.

**Vantagens:** linguagem natural sem perder controlo; os efeitos continuam determinísticos; permite corrigir inconsistências atuais entre `usage`, `allowedArgs` e implementação.

**Contras:** exige catálogo de intenções e testes de registry; frases ambíguas precisam de fallback.

**Esforço:** médio. **Recomendação:** evolução natural depois da opção 1.

---

### Opção 3 — Q&A fundada em dados com UTCP

**Ideia:** descrever os serviços e fontes acessíveis como **UTCP tools** e deixar o LLM escolher e chamar essas tools através do cliente UTCP. Não existe um "tool calling" específico do OpenAI/LangChain espalhado pelo código: UTCP é a camada comum de protocolo.

**Protocolos UTCP a usar:**

| Protocolo / plugin | Uso neste projeto |
|---|---|
| `@utcp/sdk` | Cliente comum: `searchTools()`, `callTool()`, manuais, cache de ferramentas e variáveis namespaceadas |
| `@utcp/direct-call` | Expor funções dos serviços atuais (`src/services/*`) como tools sem criar wrapper servers |
| `@utcp/http` | Chamar APIs REST já usadas pelo bot e, no futuro, OpenAPI convertido automaticamente em manual UTCP |
| `@utcp/http` — Streamable HTTP | Respostas longas/streaming de ferramentas HTTP, sem protocolo paralelo |
| `@utcp/http` — Server-Sent Events (SSE) | Eventos em tempo real, por exemplo streams de dados ou progresso de jobs |
| `@utcp/text` e `@utcp/file` | Carregar manuais estáticos, documentação e ficheiros locais de forma controlada |
| `@utcp/cli` | Envolver scripts existentes apenas em sandbox, com argumentos sanitizados |
| `@utcp/mcp` | Interoperabilidade se aparecerem servidores MCP externos; não é necessário para começar |
| `@utcp/dotenv-loader` | Resolver `${VAR}` dos manuais a partir de `.env` sem valores sensíveis no manual |

Exemplos de tools, com nomes no formato `manual.tool`:

- `vost_prociv.get_all`, `vost_prociv.filter_by_status`
- `vost_fires.get_important`, `vost_fires.get_by_district`
- `vost_warnings.get_all`, `vost_ipma.get_warnings`
- `vost_earthquakes.get_by_date`
- `vost_weather.get_by_day`
- `vost_acronyms.get_exact`
- `vost_sns.get_alerts`
- `vost_corona.get_resume`

**Fluxo:** pergunta → LLM escolhe tool UTCP → `UtcpClient.callTool()` → serviço/fonte devolve dados → LLM redige resposta curta em português → anexar fonte/timestamp quando disponível.

**Regra de ouro:** toda a informação acessível ao chat entra por um manual UTCP. Se uma fonte não tiver protocolo UTCP nativo, cria-se um adaptador/direct-call ou um manual HTTP; nunca um caminho ad hoc dentro do comando.

**Vantagens:** respostas fundadas em dados reais; interoperabilidade entre HTTP, ficheiros, CLI e MCP; os serviços atuais não precisam de ser modificados para virar tools.

**Contras:** mais tokens, latência e complexidade; texto obtido de HTML/RSS pode conter instruções maliciosas e deve ser tratado sempre como **dado**, nunca como comando.

**Esforço:** médio-alto. **Recomendação:** só depois de existir um bom catálogo de manuais UTCP e cache TTL.

---

### Opção 4 — Sumarização e tradução de feeds recorrentes

**Ideia:** usar o LLM para transformar conteúdos longos em resumos curtos para Discord e redes sociais, mantendo os templates determinísticos como fallback. Qualquer conteúdo usado como entrada deve ser obtido por UTCP tools; esta opção é futura e não altera os jobs atuais sem aprovação explícita.

Aplicações:

- resumo de avisos IPMA/MeteoAlarm;
- compressão de decretos DRE;
- resumo de relatórios DGS;
- versões PT/EN/ES para voluntários internacionais;
- títulos e descrições alternativas para imagens.

**Vantagens:** melhora legibilidade em canais de emergência; facilita publicação multilíngue; reutiliza os jobs atuais.

**Contras:** risco de perder precisão, nomes próprios, números e tom institucional. Em mensagens de emergência, um resumo errado é pior do que um template longo.

**Esforço:** médio. **Recomendação:** adotar com validação de campos obrigatórios, limite de caracteres e revisão humana para canais críticos.

---

### Opção 5 — Agente restrito para fluxos com efeitos de escrita

**Ideia:** permitir que um agente execute workflows já protegidos, como `!corona update`, `!corona notify`, `!rally update` ou `!rally info`, mas apenas através de ferramentas UTCP autorizadas e com aprovação. Os comandos originais continuam intactos; esta seria uma forma alternativa de invocar os mesmos serviços.

Controlos obrigatórios:

- allowlist de users, roles e canais;
- `dry_run` por omissão;
- confirmação humana explícita antes de publicar/escrever;
- tool registry implementado com manuais UTCP e schemas rígidos; writes apenas via `@utcp/direct-call` para os serviços atuais, nunca via SDK de rede dentro do agente;
- logs de auditoria com `tool`, `args`, `user`, `channel`, `result`;
- idempotência e rollback quando o serviço suportar;
- o modelo **nunca** recebe tokens de Twitter, Telegram, FTP, Google ou Discord.

**Vantagens:** automação conversacional de tarefas operacionais repetitivas.

**Contras:** maior risco operacional e de segurança; depende de avaliação de qualidade das opções 1–3.

**Esforço:** alto. **Recomendação:** último estágio; não começar por aqui.

### Ordem recomendada

```text
1. Gateway OpenRouter + cliente UTCP
2. Router de intenção sobre tools UTCP
3. Manuais UTCP / RAG leve
4. Sumarização multilíngue
5. Agente UTCP com escrita e aprovação
```

---

## 6. Bibliotecas mais adequadas

| Biblioteca | Papel | Adequação ao projeto |
|---|---|---|
| `openai` | Cliente OpenAI-compatible; apontar `baseURL` para OpenRouter | **Primeira escolha** para chat; evita inventar cliente HTTP |
| `@utcp/sdk` | Cliente UTCP: descoberta, pesquisa e chamada de tools | **Obrigatório** a partir da opção 1. Publica `dist/index.cjs`, compatível com `require()` do projeto |
| `@utcp/direct-call` | Expor funções `src/services/*` como UTCP tools sem wrapper servers | **Primeiro plugin recomendado**; mantém regras de negócio onde já estão |
| `@utcp/http` | Tools para REST/webhooks, SSE, Streamable HTTP e conversão de OpenAPI | Usar para as APIs externas, streams e webhook Copernicus quando fizer sentido |
| `@utcp/text`, `@utcp/file` | Manuais e conteúdos estáticos | Úteis para documentação e configuração versionada; `@utcp/file` é Node-only |
| `@utcp/cli`, `@utcp/mcp` | CLI em sandbox e interoperabilidade MCP | Instalar apenas quando existir necessidade real |
| `@utcp/dotenv-loader` | Resolver `${VAR}` dos manuais a partir de `.env` | Evita segredos escritos nos manuais |
| `@langchain/core`, `@langchain/openai`, `@langchain/langgraph` | Grafos de agente/memória | Opcional; verificar ESM/CJS. Não substitui UTCP como camada de protocolo |
| `zod` | Validar JSON de intenções e schemas UTCP | Recomendado; `ajv` é alternativa CJS |
| `pino` | Logs estruturados com redação de segredos | Melhor que `console.log` para custo, latência e auditoria |
| `bottleneck` ou `limiter` | Limitar chamadas por utilizador/canal e concorrência | Importante para controlar custo no OpenRouter |
| `tiktoken` | Contar tokens antes de enviar e truncar histórico | Útil para orçamentos e para não estourar contexto |
| `nock` + `jest` | Mock de HTTP nos testes | O projeto já usa Jest; evita chamadas reais ao provider e a tools UTCP |
| `langfuse` | Tracing de prompts, custos e avaliação | Opcional; útil com vários prompts/modelos |
| `ai` + `@ai-sdk/openai` | Alternativa de tool calling tipado | ESM-first; só se o projeto for migrado para ESM |
| `discord.js` | Manter v11 por agora | Migrar para v14 apenas se forem necessários slash commands/modais |

`axios` e `node-fetch` já existem no projeto, pelo que não é necessário introduzir um novo cliente HTTP apenas para chamar o OpenRouter.

UTCP segue uma arquitetura modular de plugins: cada protocolo tem call templates próprios e o cliente comum descobre ferramentas via manuais. O Node SDK publica builds CommonJS e ESM, pelo que é compatível com o estilo atual do repositório; ainda assim, deve-se fixar versões e validar o carregamento em `jest`/`node` antes de adicionar plugins.

---

## 7. Guardrails transversais

- **Não alterar o existente:** nenhum comando, trigger, reação, job ou interação atual muda; apenas é adicionado `!chat`.
- **Idioma e persona:** português de Portugal, tom VOSTPTia; system prompt versionado em ficheiro, não espalhado por comandos.
- **Erro do `!chat`:** qualquer erro do provider ou ferramenta resulta em `Infelizmente não te posso responder`; detalhe apenas em log interno. Não existe verificação de créditos/saldo.
- **Segredos:** `LLM_API_KEY` apenas no ambiente; nunca incluir tokens em prompts, logs ou mensagens.
- **Tempos limite e retry:** timeout curto, retry com backoff e fallback determinístico. Um falhanço do LLM não pode impedir comandos críticos já existentes.
- **Orçamento:** limite de tokens por pedido, histórico curto e cache para perguntas repetidas.
- **UTCP como único caminho de ferramentas:** sem chamadas diretas a serviços/APIs a partir do modelo; manuais versionados, descoberta com `searchTools` e execução com `callTool`.
- **Segurança UTCP:** URLs HTTPS/WSS em produção; loopback apenas em desenvolvimento; credenciais via `${VAR}` e dotenv-loader; filtrar tools por permissão antes de as expor ao modelo.
- **Permissões:** o LLM não contorna `limitToChannels`, `userLists`, `roleLists` ou cooldowns.
- **Fonte da verdade:** dados meteorológicos, de ocorrências e de saúde vêm dos serviços atuais; o modelo redige, não inventa.
- **Prompt injection:** conteúdos de HTML/RSS/CSV são dados não confiáveis; instruções dentro desses conteúdos devem ser ignoradas.
- **Auditoria:** registar provider, modelo, custo estimado, latência, ID de pedido e chamadas UTCP sem guardar conteúdos sensíveis.
- **Testes:** mock do provider e das UTCP tools; casos de erro do provider, timeout, JSON inválido, baixa confiança e falta de permissão. Em todos os casos de erro do `!chat`, verificar a frase exata de resposta.

---

## 8. Estrutura ilustrativa futura

Estes nomes são apenas sugestões de organização; nada disto foi criado neste relatório:

```text
config/llm.js
src/commands/chat.js                         # novo comando; nada é alterado nos existentes
src/services/llm/index.js
src/services/llm/providers/openrouter.js
src/services/llm/prompts/vostptia.js
src/services/llm/validate.js
src/services/llm/utcp/client.js              # UtcpClient
src/services/llm/utcp/manuals/vost.json      # tools de leitura dos serviços atuais
src/services/llm/utcp/tools/vost.js          # registos @utcp/direct-call
__tests__/services/llm.test.js
__tests__/services/llm/utcp.test.js
```

A fronteira mais importante é simples: **um adapter por provider, uma API interna estável, e todos os efeitos de negócio dentro dos serviços já existentes**. Assim, trocar OpenRouter por Anthropic, Gemini, Azure OpenAI ou um modelo self-hosted não obriga a alterar comandos, triggers nem jobs.

---

## 9. Conclusão

O bot já tem uma arquitetura razoável para adicionar LLM: os comandos lidam com interação, os serviços com regras de negócio e os APIs com fontes externas. O caminho de menor risco é:

1. criar o gateway OpenRouter, com resposta curta e consistente quando o provider não responde;
2. expor o chat através de um **novo comando** `!chat`, sem tocar em menções, triggers ou comandos existentes;
3. usar saída estruturada para interpretar intenção;
4. ligar fontes e serviços por **manuais UTCP**, usando `direct-call` para os serviços atuais e `http` para APIs externas;
5. só depois considerar sumarização e agentes com escrita, sempre com aprovação humana.

Isto preserva a fiabilidade operacional do VOSTPTia, mantém intacta toda a interação atual e abre espaço para experiências com LLM, UTCP e novos providers.
