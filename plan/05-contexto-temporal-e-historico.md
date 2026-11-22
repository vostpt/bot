# Plano 05 — Contexto temporal e limites de histórico

## Objetivo (uma coisa)

Definir como o chat interpreta datas relativas e como informa o utilizador quando não existem dados históricos. Este plano não cria arquivo histórico nem altera jobs.

## Ficheiros a criar

```text
src/services/llm/time.js
src/services/llm/utcp/tools/context.js
__tests__/services/llm/time.test.js
```

## Intervalos suportados

- `hoje`
- `ontem`
- `faz N dias`, `faz N semanas`, `faz N meses`
- datas ISO `AAAA-MM-DD`
- datas portuguesas `DD/MM/AAAA`
- formato VOST `DDMMMAAAA`, quando já usado pelo bot

Fuso horário: `Europe/Lisbon`. Toda a data resolvida é devolvida em ISO-8601 com timezone.

## Contrato do resolvedor

```js
resolveDateRange(question, now = new Date()) -> {
  start,
  end,
  label,
  supported: true|false
}
```

- `label`: texto curto para usar na resposta, por exemplo `há 3 semanas`.
- Se não conseguir resolver: `supported: false`; o agente pede esclarecimento.
- Nunca converter “faz 3 semanas” em “hoje”.

## Limites de dados — decisão A

- **Fogos/ProCiv:** só há dados atuais. Para qualquer período passado, a tool devolve explicitamente:

```json
{
  "source": "prociv",
  "available": false,
  "reason": "sem dados históricos",
  "data": []
}
```

- **DRE:** só são considerados os documentos recentes devolvidos pela fonte atual. Não é permitido afirmar que saiu um Diário da República num dia antigo sem dados.
- **Outras fontes:** aplicar o mesmo princípio — se a tool não devolve dados para o período, o agente diz que não tem dados.

## Responsabilidade do agente

O prompt do plano 06 deve obrigar o agente a:

1. resolver a data antes de escolher tools;
2. passar `start`/`end` às tools que suportam datas;
3. usar apenas `available: true`;
4. quando `available: false`, responder com frase explícita;
5. nunca preencher lacunas com conhecimento geral do modelo.

## Exemplo de resposta correta

Pergunta:

```text
Que fogos houve faz 3 semanas e que diarios da republica sairam nesses dias
```

Resposta esperada, em substância:

```text
Não tenho dados históricos de fogos para há 3 semanas. Quanto aos Diários da República, só tenho acesso aos documentos recentes disponíveis neste momento, pelo que não posso confirmar os desses dias.
```

## Critérios de aceitação

- [ ] `faz 3 semanas` resolve para um intervalo de 21 dias.
- [ ] Nenhuma tool histórica é inventada.
- [ ] Nenhum job ou base de dados é alterado para criar arquivo.
- [ ] O agente recebe `available: false` e transforma isso em resposta honesta.
- [ ] Datas ambíguas geram pedido de esclarecimento, não suposição.

## Verificação

- Testes unitários para todas as formas de data.
- Teste com data relativa congelada (`now` fixo).
- Teste de prompt com `available: false`.
- Verificar que `src/jobs/index.js` não é modificado.
- `git diff --check`.
