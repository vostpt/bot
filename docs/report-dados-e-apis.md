# Relatório — Dados e APIs do VOSTPTia

Data: 2026-11-20  
Escopo: código atual do repositório (inclui alterações locais ainda não cometidas).  
Objetivo: listar **que informação o bot consegue ir buscar** e **de onde** vem cada dado.

---

## 1. Resumo

O bot obtém informação de quatro tipos de origem:

| Tipo de origem | Exemplos | Acesso |
|---|---|---|
| **API VOST** | fogos, ProCiv, sismos, meteorologia, vento, avisos, acrónimos | `https://bot-api.vost.pt` e `https://api.vost.pt` |
| **Feeds / sites públicos** | IPMA, MeteoAlarm, SNS24, Diário da República, DGS, Portal das Comunidades, Facebook, GitHub | HTTPS + HTML/RSS/CSV scraping |
| **Google Sheets** | resumos COVID-19, mensagens MEDEA | Google Sheets API (service account) e feed público CSV |
| **Estado local** | SQLite, ficheiro CSV do Rally | `data/db.*.sqlite`, `RALLYFILEPATH` |

Duas vias de consulta coexistem:

1. **`!chat <pergunta>`** — o LLM escolhe ferramentas UTCP read-only (20 ferramentas: 15 `direct-call` + 5 `http`).
2. **Comandos clássicos / jobs** — ligam diretamente aos serviços (`src/services/`) e às APIs (`src/api/`).

Os dados de **fogos e ProCiv são apenas atuais**. O agente devolve `available: false` com `reason: "sem dados históricos"` quando a pergunta pede um intervalo passado. Sismos e Diário da República (últimos 7 dias) são as exceções com dados datados.

---

## 2. API VOST — `https://bot-api.vost.pt`

Definida em `config/api.js` como `baseURL`. Não requer chave nas chamadas atuais.

| Endpoint | Dados devolvidos | Serviço / comando | UTCP (`!chat`) | Notas |
|---|---|---|---|---|
| `GET /getIF.php` | Todas as ocorrências de incêndios florestais (IF) em curso | `Fires.getForestFires`, job `forestFires` | — | Publica novidades no canal de fogos |
| `GET /getImportantIF.php` | Incêndios marcados como importantes | `Fires.getImportantForestFires` | `vost_fires.get_important` | Devolveu `[]` no teste de 2026-11-20 |
| `GET /getIFDistrito.php?distrito=<id>` | Incêndios ativos de um distrito | `Fires.getByDistrict`, `!op distrito` | `vost_fires.get_by_district` | O comando `!op distrito` converte o nome em ID (ex.: `leiria` → `11`); a ferramenta UTCP passa o texto recebido do LLM |
| `GET /getAllProciv.php` | Ocorrências atuais da Protecção Civil | `Prociv.getAll` | `vost_prociv.get_all`, `get_by_id`, `get_by_city`, `filter_by_status` | Base de `!all`, `!op`, `!stats` |
| `GET /getSismos.php` | Sismos registados (magnitude, profundidade, local, sentido, coordenadas) | `Earthquakes.getAll/getByDate`, `!sismos`, jobs beta | `vost_earthquakes.get_by_date` | Filtro por data feito localmente |
| `GET /getIPMA.php?day=0\|1` | Previsão meteorológica por localidade (temperaturas, precipitação, vento) | `Weather.getByDay`, `!weather` | `vost_weather.get_by_day` | `0` = hoje, `1` = amanhã |
| `GET /getWindy.php?id=<id>` | Vento para um concelho/cidade | `Winds.getById`, `!op ir vento` | — | ID numérico do distrito/local |
| `GET /getAvisos.php` | Avisos meteorológicos atuais (IPMA) | `Warnings.getAll`, `!alerts` | — | Serviço marcado `TO BE DEPRECATED SOON` |
| `GET /getAlertas.php` | Alertas VOST | `WarningsApi.getAll` (definido) | — | Implementado mas sem utilização nos serviços atuais |
| `GET /images/<ficheiro>` | Imagens de avisos e relatórios | `baseImagesURL` | — | Anexos em publicações Discord/redes sociais |
| `POST <cloud function>/addMeteo` | Envio de aviso meteorológico para a app VOST | `WarningsApi.postNewWarning` | — | **Escrita**; requer `WARNINGAPPKEY` no header `X-VOSTWARNINGS` |

### API de acrónimos — `https://api.vost.pt`

| Endpoint | Dados | Utilização |
|---|---|---|
| `GET /v1/acronyms/?search=<termo>&exact=1` | Definição exata de acrónimos VOST | `!acronimo`, UTCP `vost_acronyms.get_exact` e `vost_http.acronym_lookup` |

---

## 3. Outras fontes de dados (leitura)

| Fonte | URL / endpoint | Dados | Utilização | Autenticação |
|---|---|---|---|---|
| **IPMA (scraping)** | `https://www.ipma.pt/pt/index.html` → `var result_warnings` | Avisos meteorológicos amarelos/laranja/vermelho | `IpmaApi.fetch()`, UTCP `vost_ipma.get_current_warnings`, job `warnings` | Nenhuma |
| **IPMA — mapa RCM** | `https://www.ipma.pt/resources.www/transf/clientes/11000.anpc/risco_incendio/fwi/RCM24_conc.jpg` | Mapa de risco de incêndio para hoje | `!rcm hoje`, job `fireRisk`, UTCP `vost_http.fire_risk_map` | Nenhuma |
| **MeteoAlarm** | `https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-<país>` (37 países) | Avisos laranja/vermelho: tipo, região, início/fim, severidade | `MeteoAlarmApi.fetch()`, UTCP `vost_meteoalarm.get_current`, job `warningsMeteoAlarm` | Nenhuma |
| **SNS24** | `https://www.sns24.gov.pt/alertas/` | Alertas de saúde: título, descrição, link, data | `Sns.getAlerts()`, `!sns24 alerts`, UTCP `vost_sns.get_alerts` | Nenhuma (HTML) |
| **Diário da República** | `https://dre.pt/home/-/dre/feed/exclusive/1/cacheLevelPage?serie=I` e `?serie=II&parte=C` | Decretos (Série I) e despachos (Série II) | `JournalApi.getJournal()`, job `checkNewDecrees`, UTCP `vost_journal.get_recent` | Nenhuma (RSS) |
| **DGS / COVID-19** | `https://covid19.min-saude.pt/relatorio-de-situacao/` | Ligações e títulos dos relatórios de situação | jobs `checkNewReports` / `checkUpdatesCoronaReports` | Nenhuma (HTML) |
| **Google Sheets — COVID** | Google Sheets API, `DGSRESUMESID` + `DGSRESUMESGID` | Resumo diário e variação semanal | `Corona.getResume()`, UTCP `vost_corona.get_resume`, `!corona resumo` | Service account `data/auth/vostpt-bot.json` |
| **Google Sheets — URL pública** | `https://spreadsheets.google.com/feeds/list/<id>/<gid>/public/values?alt=json` | Resumos DGS (feed legado) | `CoronaApi.getDgsResumes()` | Nenhuma |
| **GitHub (raw)** | `https://raw.githubusercontent.com/vostpt/daily_weather_report/main/daily_meteo_report_{pt,mad,az}.png` | Extremos diários verificados pelo IPMA (Continente, Madeira, Açores) | `!weather extremes`, job `sendWeatherReport`, UTCP `vost_http.weather_report_*` | Nenhuma |
| **MEDEA** | Google Sheets CSV público em `config/medea.js` | Mensagens de exercício (timestamp, origem, entidade, local, tipo, mensagem, ação) | job `checkMedeaMessages` → Twitter | Nenhuma |
| **Portal das Comunidades (MNE)** | `https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/conselhos-aos-viajantes/<região>/<país>` | Conselhos aos viajantes atualizados hoje | job `checkConselhoViajantes` | Nenhuma (HTML) |
| **Facebook Graph API** | `GET /<página>/feed` via pacote `fb` | Publicações recentes das páginas VOSTPT/Rally | job `getFacebookPosts` | `FACEBOOK_TOKEN_VOSTPT`, `FACEBOOK_TOKEN_RALLY` |
| **ipify** | `https://api.ipify.org?format=json` | IP público da máquina | `!debug` (canal de gestão) | Nenhuma |
| **Discord** | Gateway/API via `discord.js@11` | Mensagens, reações, canais, membros | entrada/saída de todos os comandos | `BOT_TOKEN` |
| **OpenRouter** | `https://openrouter.ai/api/v1` (compatível OpenAI) | Inferência LLM para o `!chat` | `src/services/llm/providers/openrouter.js` | `LLM_API_KEY` / `OPENROUTER_TOKEN` |

### Estado local (não é API externa)

| Ficheiro / base | Dados | Utilização |
|---|---|---|
| `data/db.dev.sqlite` (ou `db.production.sqlite`) | Tabelas `Tweets`, `CoronaReports`, `Decrees`, `MeteoAlarmWarnings`, `FbPosts`, `IpmaWarnings`, `MedeaMessages` | Deteção de duplicados e histórico do bot; `vost_corona.get_all` lê `CoronaReports` |
| `RALLYFILEPATH` (CSV) | Zonas de estacionamento do Rally e lotação | `!rally update` / `!rally upload` |
| `data/auth/vostpt-bot.json` | Credencial Google service account | Leitura/escrita das spreadsheets COVID |

---

## 4. Ferramentas UTCP disponíveis no `!chat`

Definidas em `src/services/llm/utcp/manuals/{vost,http}.json`, implementadas em `src/services/llm/utcp/tools/vost.js` e filtradas por `src/services/llm/utcp/allowlist.js`. **Todas são read-only** — não existe ferramenta de publicação ou escrita.

| Ferramenta | Fonte de dados |
|---|---|
| `vost_prociv.get_all` | `GET /getAllProciv.php` |
| `vost_prociv.get_by_id` | `GET /getAllProciv.php` + filtro local por ID |
| `vost_prociv.get_by_city` | `GET /getAllProciv.php` + filtro local por localidade |
| `vost_prociv.filter_by_status` | `GET /getAllProciv.php` + filtro local por estado |
| `vost_fires.get_important` | `GET /getImportantIF.php` |
| `vost_fires.get_by_district` | `GET /getIFDistrito.php` |
| `vost_ipma.get_current_warnings` | IPMA (scraping da página inicial) |
| `vost_meteoalarm.get_current` | Feeds MeteoAlarm (por país) |
| `vost_earthquakes.get_by_date` | `GET /getSismos.php` |
| `vost_weather.get_by_day` | `GET /getIPMA.php?day=` |
| `vost_acronyms.get_exact` | `https://api.vost.pt/v1/acronyms` |
| `vost_sns.get_alerts` | SNS24 (scraping) |
| `vost_corona.get_all` | SQLite local (`CoronaReports`) |
| `vost_corona.get_resume` | Google Sheets (service account) |
| `vost_journal.get_recent` | RSS do Diário da República (últimos 7 dias) |
| `vost_http.acronym_lookup` | `https://api.vost.pt/v1/acronyms?search={search}&exact=1` |
| `vost_http.fire_risk_map` | Mapa RCM do IPMA |
| `vost_http.weather_report_pt` | GitHub raw — extremos Continente |
| `vost_http.weather_report_mad` | GitHub raw — extremos Madeira |
| `vost_http.weather_report_az` | GitHub raw — extremos Açores |

Resultado normalizado devolvido ao LLM:

```json
{
  "source": "fires",
  "retrievedAt": "2026-11-20T23:05:56.233Z",
  "available": true,
  "data": [],
  "limit": 3
}
```

Quando a pergunta é sobre o passado e a fonte só tem dados atuais, `available` é `false` e `reason` é `sem dados históricos`.

---

## 5. Comandos e jobs por origem de dados

| Origem | Comandos | Jobs (modo produção / beta) |
|---|---|---|
| ProCiv / fogos | `!all`, `!op`, `!stats` | `forestFires`, `fireRisk` |
| Sismos | `!sismos` | `earthquakes`, `noticeableEarthquakes` (beta) |
| Meteorologia / avisos | `!weather`, `!alerts`, `!rcm` | `warnings`, `warningsMeteoAlarm`, `sendWeatherReport` |
| Acrónimos | `!acronimo` | — |
| SNS24 | `!sns24 alerts` | — |
| COVID-19 | `!corona reports`, `!corona resumo` | `checkNewCoronaReports`, `checkUpdatesCoronaReports` |
| Diário da República | — | `checkNewDecrees` |
| Facebook | — | `getFacebookPosts` |
| MEDEA | — | `checkMedeaMessages` |
| Conselhos aos viajantes | — | `checkConselhoViajantes` |
| Rally | `!rally upload/update/info` | — |
| Redes sociais / IP público | `!vost`, `!debug` | `scheduleVostEuTweets` |

---

## 6. APIs de saída (publicação) — não são fontes de dados

| Destino | API / endpoint | Credenciais |
|---|---|---|
| Twitter / X | `twitter-api-v2` (v2 `tweet`, v1.1 `uploadMedia`); contas `main`, `azores`, `europe`, `vostptia`, `dre`, `rally` | `TWITTER_*` |
| Facebook Graph | `POST /<página>/feed` | `FACEBOOK_TOKEN_*` |
| Telegram Bot API | `messaging-api-telegram` (`sendMessage`, `sendPhoto`, `sendDocument`) | `TELEGRAM_*` |
| Mastodon / Pleroma | `https://trombas.vost.pt/api/v1/statuses`, `/v2/media` | `VOSTPT_ACCESS_TOKEN`, `PTDRE_ACCESS_TOKEN` |
| Bluesky / AT Protocol | `https://bsky.social/xrpc/com.atproto.server/createSession`, `repo/uploadBlob`, `repo/createRecord` | `BSKY_HANDLE`, `BSKY_PASS`, `BSKY_REPOHANDLE` |
| FTP (mirror DGS) | `basic-ftp` para `/public_html/mirror` | `FTPSERVER`, `FTPUSER`, `FTPPASSWORD` |
| Discord | Gateway + REST via `discord.js@11` | `BOT_TOKEN` |

---

## 7. Limitações e considerações

- `LLM_CHAT_ONLY=true` desativa jobs, triggers, menções e outros comandos — deixa apenas `!chat`. Útil para testar sem publicar nada.
- Sem as credenciais de Twitter/Facebook/Telegram/Mastodon/Bluesky/FTP, os jobs de publicação falham ou são ignorados; a consulta de dados continua a funcionar.
- `BETA_MODE`, `NODE_ENV` e `COOLDOWN` aparecem duplicados no `.env` local; o valor final é o último. Antes de arrancar o bot completo, remover as duplicatas.
- `!chat` usa no máximo 4 ferramentas por resposta, duas fases de LLM (planeamento e resposta final, cada uma com retry em resposta vazia) e trunca a resposta em 1900 caracteres.
- O fallback do OpenRouter só dispara em erro 402 (créditos), não em ID de modelo inválido.
- A telemetria OTLP é opcional e fica desativada sem `OTEL_EXPORTER_OTLP_ENDPOINT` (ver `docs/observability.md`).

---

## 8. Verificação rápida das APIs

```sh
# API VOST — fogos
curl -i --max-time 20 https://bot-api.vost.pt/getImportantIF.php

# API VOST — acrónimos
curl -i --max-time 20 'https://api.vost.pt/v1/acronyms/?search=ANPC&exact=1'

# Mesmo caminho usado pelo !chat, sem Discord e sem LLM
node - <<'JS'
const { callTool } = require('./src/services/llm/utcp/client');
(async () => {
  for (const name of ['vost_fires.get_important', 'vost_prociv.get_all']) {
    const r = await callTool(name, { limit: 3 });
    console.log(`${name}: source=${r.source} available=${r.available} retrievedAt=${r.retrievedAt} items=${r.data.length}`);
  }
})().catch(e => { console.error('ERRO: ' + e.message); process.exit(1); });
JS
```

`available=true` com `retrievedAt` preenchido confirma que a chamada chegou à fonte. `items=0` significa apenas que a fonte está vazia neste momento.

---

## 9. Estado pontual das fontes (verificação com `curl`, 2026-11-20)

| Fonte | Resultado | Leitura
|---|---|---
| `bot-api.vost.pt/getSismos.php` | `200`, ~72 KB | Funcional
| `bot-api.vost.pt/getImportantIF.php` | `200`, `[]` | Funcional, sem ocorrências importantes agora
| `www.ipma.pt/pt/index.html` | `200`, ~1,1 MB | Funcional (scraping de avisos)
| `feeds.meteoalarm.org/...portugal` | `200`, ~78 KB | Funcional
| `dre.pt/...serie=I` | `200`, ~7 KB | Funcional
| GitHub raw — mapa de extremos PT | `200`, ~479 KB | Funcional
| `api.vost.pt/v1/acronyms?...` | timeout após 12 s | Pode ser temporário; verificar antes de depender de `!acronimo`
| `www.sns24.gov.pt/alertas/` | `404` | URL possivelmente desatualizada; `!sns24 alerts` pode falhar
| `covid19.min-saude.pt/relatorio-de-situacao/` | falha de DNS | Os jobs de relatórios DGS podem estar sem fonte
| `portaldascomunidades.mne.gov.pt/...` | falha de handshake TLS no `curl` local | Pode ser específico do ambiente; confirmar no servidor de produção

Estes resultados são uma amostra pontual, não um SLA. Redirecionamentos, geobloqueio ou indisponibilidade temporária podem alterá-los.
