# Plano 04 — Tools HTTP UTCP para fontes externas

## Objetivo (uma coisa)

Definir como fontes externas sem parser próprio são expostas ao chat via `@utcp/http`, complementando as tools `direct-call` do plano 03.

## Ficheiros a criar

```text
src/services/llm/utcp/manuals/http.json
src/services/llm/utcp/allowlist.js  (atualização)
__tests__/services/llm/utcp/http.test.js
```

## Âmbito

Usar `@utcp/http` apenas para:

- URLs JSON simples já consumidas pelo bot;
- URLs de imagens/relatórios cuja utilidade é devolver o link;
- endpoints públicos que não exigem scraping ou parse HTML/RSS personalizado.

Fontes que exigem `cheerio`, `csv`, RSS parser ou regras de negócio continuam no plano 03 como `direct-call`.

## Ferramentas HTTP previstas

| Tool | Método | URL base | Uso |
|---|---|---|---|
| `vost_http.acronym_lookup` | GET | `https://api.vost.pt/v1/acronyms/` | Alternativa HTTP direta ao acrónimo |
| `vost_http.fire_risk_map` | GET | `http://www.ipma.pt/.../RCM24_conc.jpg` | Devolver link da imagem de risco |
| `vost_http.weather_report_pt` | GET | GitHub raw | Link do relatório PT |
| `vost_http.weather_report_mad` | GET | GitHub raw | Link do relatório Madeira |
| `vost_http.weather_report_az` | GET | GitHub raw | Link do relatório Açores |

Se uma URL usar HTTP plain fora de loopback, não é exposta; registar a limitação e usar a alternativa HTTPS quando existir.

## Call template

```json
{
  "name": "vost_http.acronym_lookup",
  "description": "Procura um acrónimo na API VOST",
  "inputs": {
    "type": "object",
    "properties": {
      "search": { "type": "string", "minLength": 2, "maxLength": 40 }
    },
    "required": ["search"]
  },
  "tags": ["acronimo", "vost"],
  "tool_call_template": {
    "call_template_type": "http",
    "http_method": "GET",
    "url": "https://api.vost.pt/v1/acronyms/?search={search}&exact=1"
  }
}
```

## Regras

- Apenas `GET`.
- Nenhuma credencial em query string visível no manual; usar `${VAR}` quando necessário.
- Timeout configurado no cliente UTCP/provider.
- Resposta normalizada pelo agente, não pela tool HTTP.
- Qualquer 4xx/5xx lança erro para o plano 06.
- Nenhuma ferramenta desta planifica publica dados.

## Critérios de aceitação

- [ ] Tools HTTP aparecem em `searchTools`.
- [ ] Nenhuma tool usa método diferente de GET.
- [ ] Nenhuma credencial está escrita no manual.
- [ ] Erros HTTP são propagados como erro, não como resposta vazia.
- [ ] Fontes com parser mantêm-se em `direct-call`.

## Verificação

- Mock HTTP com `nock`.
- Teste de URL com argumento substituído.
- Teste de 404/500.
- Teste de allowlist.
- `git diff --check`.
