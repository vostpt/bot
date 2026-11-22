# Observabilidade com OpenTelemetry

O bot exporta **traces, métricas e logs** por OTLP **apenas quando existe um coletor configurado e a recolha foi explicitamente ativada**. Sem `OTEL_ENABLED=true` **ou** sem `OTEL_EXPORTER_OTLP_ENDPOINT`, o SDK nem chega a ser carregado: os helpers são no-op e o comportamento é idêntico ao de antes.

> Um `OTEL_EXPORTER_OTLP_ENDPOINT` herdado do ambiente (por exemplo, o harness aponta para `http://localhost:3000`) **não ativa** a telemetria. É necessário `OTEL_ENABLED=true`.

## Ativar

Qualquer recetor OTLP serve (Grafana Alloy, OpenTelemetry Collector, ou diretamente o gateway do Grafana Cloud).

```sh
# Alloy/Collector local, OTLP/HTTP
OTEL_ENABLED=true
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_PROTOCOL=http/protobuf

# Ou gRPC
# OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4317
# OTEL_EXPORTER_OTLP_PROTOCOL=grpc

# Opcional
OTEL_SERVICE_NAME=vostpt-bot
OTEL_RESOURCE_ATTRIBUTES=deployment.environment=development
```

Estas variáveis podem ir no `.env` (o `app.js` carrega o dotenv antes de iniciar a telemetria) ou no ambiente do processo. Para Grafana Cloud, usa também `OTEL_EXPORTER_OTLP_HEADERS` com a autorização Basic do gateway; os exporters leem essa variável diretamente.

Ao arrancar com telemetria ativa aparece no terminal:

```text
📡 OpenTelemetry ativo
```

No `SIGINT`/`SIGTERM` (por exemplo `Ctrl+C`) os providers são encerrados e os dados pendentes são enviados antes de o processo sair.

## O que é instrumentado

| Sinal | Onde | Exemplos |
|---|---|---|
| Traces | mensagem do Discord → comando → `!chat` → LLM → ferramenta UTCP | `discord.message`, `command.execute`, `chat.command`, `llm.plan`, `llm.answer`, `llm.completion`, `utcp.tool.call` |
| Métricas | mesmos pontos | `vostbot.discord.messages`, `vostbot.commands`, `vostbot.chat.requests`, `vostbot.chat.duration`, `vostbot.llm.calls`, `vostbot.llm.tokens`, `vostbot.llm.duration`, `vostbot.utcp.tool.calls`, `vostbot.utcp.tool.duration` |
| Logs | falhas e eventos operacionais | `chat.failed`, `command.failed`, `utcp.tool.failed`, `budget_exhausted` |

Os atributos incluem IDs de canal/mensagem, nome do comando, nome da ferramenta, fase do LLM, modelo e contagens de tokens. **Não são enviados** o texto da pergunta, tokens do bot/OpenRouter nem argumentos das ferramentas.

## Verificar no Grafana

Depois de enviar um `!chat`:

```text
# Tempo (Tempo / Explore)
{ resource.service.name = "vostpt-bot" }

# Métricas (Mimir / Explore)
sum by (result) (rate(vostbot_chat_requests[5m]))
sum by (tool, result) (rate(vostbot_utcp_tool_calls[5m]))

# Logs (Loki / Explore)
{service_name="vostpt-bot"} |= "chat.failed"
```

Os nomes das métricas com pontos aparecem com `_` no Prometheus/Mimir.

## Coletor mínimo (Alloy)

```alloy
otelcol.receiver.otlp "default" {
  grpc { endpoint = "0.0.0.0:4317" }
  http { endpoint = "0.0.0.0:4318" }
  output {
    metrics = [otelcol.exporter.otlphttp.cloud.input]
    logs    = [otelcol.exporter.otlphttp.cloud.input]
    traces  = [otelcol.exporter.otlphttp.cloud.input]
  }
}

otelcol.exporter.otlphttp "cloud" {
  client {
    endpoint = env("GRAFANA_CLOUD_OTLP_ENDPOINT")
    auth     = otelcol.auth.basic.cloud.handler
  }
}

otelcol.auth.basic "cloud" {
  username = env("GRAFANA_CLOUD_INSTANCE_ID")
  password = env("GRAFANA_CLOUD_API_KEY")
}
```

A configuração completa do skill (com resourcedetection, batch, tail sampling e variantes para Collector/Kubernetes) está em `opentelemetry/references/collector-config.md`.

## Resolução de problemas

- `Export failed ... 404`: a URL configurada não é um recetor OTLP. Os exporters acrescentam `/v1/traces`, `/v1/metrics` e `/v1/logs` ao endpoint. Aponta para um coletor real. Neste ambiente de desenvolvimento a variável `OTEL_EXPORTER_OTLP_ENDPOINT` já vem definida pelo harness com um URL que não é OTLP; sem `OTEL_ENABLED=true` a telemetria fica desligada e não há erros de exportação. Para garantir:

  ```sh
  env -u OTEL_ENABLED -u OTEL_EXPORTER_OTLP_ENDPOINT -u OTEL_EXPORTER_OTLP_HEADERS npm start
  ```

- `401`: chave/instance ID do Grafana Cloud inválidos ou sem os *publisher roles*.
- Sem spans: confirma que `OTEL_EXPORTER_OTLP_PROTOCOL` corresponde ao recetor (`http/protobuf` para a porta 4318, `grpc` para 4317).
