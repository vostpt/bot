# Plano 03 — Tools UTCP read-only sobre serviços do bot

## Objetivo (uma coisa)

Expor funções de leitura já existentes em `src/services/` e `src/api/` como UTCP tools via `@utcp/direct-call`, sem alterar a implementação desses serviços.

## Ficheiros a criar

```text
src/services/llm/utcp/tools/vost.js
src/services/llm/utcp/manuals/vost.json  (atualização)
src/services/llm/utcp/allowlist.js       (atualização)
__tests__/services/llm/utcp/tools.test.js
```

## Tools da primeira versão

| Tool | Origem | Finalidade |
|---|---|---|
| `vost_prociv.get_all` | `Prociv.getAll` | Ocorrências atuais |
| `vost_prociv.get_by_id` | `Prociv.getById` | Ocorrência por ID |
| `vost_prociv.get_by_city` | `Prociv.getByCityAndLocal` | Ocorrências por localidade |
| `vost_prociv.filter_by_status` | `Prociv.filterByStatus` | Ocorrências por estado |
| `vost_fires.get_important` | `Fires.getImportantForestFires` | Fogos importantes |
| `vost_fires.get_by_district` | `Fires.getByDistrict` | Fogos por distrito |
| `vost_ipma.get_current_warnings` | `IpmaApi.fetch()` | Avisos IPMA atuais, **sem publicar** |
| `vost_meteoalarm.get_current` | `MeteoAlarmApi.fetch()` | Avisos MeteoAlarm atuais, **sem publicar** |
| `vost_earthquakes.get_by_date` | `Earthquakes.getByDate` | Sismos por data |
| `vost_weather.get_by_day` | `Weather.getByDay` | Previsão IPMA |
| `vost_acronyms.get_exact` | `Acronyms.getExactAcronym` | Acrónimos |
| `vost_sns.get_alerts` | `Sns.getAlerts` | Alertas SNS24 |
| `vost_corona.get_all` | `Corona.getAll` | Lista de relatórios DGS |
| `vost_corona.get_resume` | `Corona.getResume` | Resumo DGS por data |
| `vost_journal.get_recent` | `JournalApi.getJournal()` | Decreto/despachos recentes, **sem gravar nem publicar** |

## Regras obrigatórias

- Não expor funções com efeitos de escrita:
  - `Corona.updateSpreadsheet`;
  - `Corona.sendNotification`;
  - `Rally.updateCapacity`;
  - `Rally.uploadCsv`;
  - `Rally.sendInfo`;
  - `Ipma.getWarnings` (publica);
  - `Journal.checkNewDecrees` (grava e publica);
  - qualquer serviço de Twitter/Facebook/Mastodon/Telegram/Bluesky.
- Não modificar os serviços existentes; criar apenas wrappers.
- Toda a tool retorna:

```json
{
  "source": "prociv",
  "retrievedAt": "ISO-8601",
  "available": true,
  "data": []
}
```

- Quando não há dados: `available: true`, `data: []`.
- Quando a fonte falha: lançar erro; não inventar dados vazios.
- Limitar resultados com `limit` (padrão 10, máximo 50) para controlar tokens.
- Aceitar datas apenas em formatos definidos no plano 05.

## Exemplos de input

```json
{ "limit": 10 }
```

```json
{ "date": "15/03/2026" }
```

```json
{ "city": "Lisboa", "limit": 20 }
```

## Critérios de aceitação

- [ ] Todas as tools listadas aparecem em `searchTools`.
- [ ] Nenhuma tool de escrita/publicação aparece.
- [ ] Serviços existentes não são alterados.
- [ ] `available: false` nunca é usado para esconder erro real.
- [ ] Resultados são limitados por `limit`.

## Verificação

- Testar cada wrapper com mocks dos serviços/APIs.
- Testar que `IpmaApi.fetch()` é chamado em vez de `Ipma.getWarnings`.
- Testar que `JournalApi.getJournal()` não chama `db.Decrees.create`.
- Testar limite máximo de resultados.
- `git diff --check`.
