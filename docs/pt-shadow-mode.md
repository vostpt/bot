# Modo shadow

O modo shadow consulta dados atuais das fontes e usa a lógica normal do bot
para construir as mensagens. Em vez de publicar, regista as saídas previstas
no terminal e num ficheiro JSON Lines. Não inicia sessão no Discord nem publica
em redes sociais.

## Requisitos

- Node.js 20 ou 22
- Dependências instaladas com `npm ci`
- Acesso à rede para consultar as fontes pretendidas
- Valores em `.env` para as fontes que exigem autenticação

Não são necessárias credenciais de publicação das redes sociais. O workflow
opcional `facebook-feed` precisa de um token Facebook porque consulta o feed da
página.

## Pré-visualização única

Na raiz do projeto, executa:

```sh
npm run shadow
```

Sem argumentos, executa avisos IPMA atuais, o relatório meteorológico diário e
ocorrências de incêndio. Para escolher workflows:

```sh
npm run shadow -- warnings weather
npm run shadow -- warnings fire-risk fires
npm run shadow -- --help
```

Os alvos disponíveis são `warnings`, `weather`, `fires`, `fire-risk`,
`meteoalarm`, `decrees`, `travel` e `facebook-feed`.

## Simular o primeiro processamento

A base de dados shadow memoriza os avisos e eventos que já processou. Para
recriar apenas essa base de dados e considerar os registos atuais como novos:

```sh
SHADOW_RESET_DB=true npm run shadow -- warnings weather
```

A base de dados é `data/db.shadow.sqlite`, separada das bases de dados de
desenvolvimento e produção. Mantém-na entre execuções para observar apenas
novas atualizações.

## Executar os horários normais

Para executar continuamente as tarefas agendadas, mantendo todas as
publicações em modo de registo:

```sh
npm run shadow:watch
```

Termina com Ctrl+C. Os horários usam o relógio local e as mesmas opções
`JOB_*` do bot. As publicações agendadas VOST Europe continuam desativadas por
omissão.

## Consultar os registos

Cada publicação prevista aparece no terminal e é acrescentada a
`logs/publications.jsonl`. Podes escolher outro caminho com
`PUBLISH_LOG_FILE`:

```sh
PUBLISH_LOG_FILE=logs/avisos-preview.jsonl npm run shadow -- warnings
```

Cada linha JSON tem timestamp, ID da execução, destino e conteúdo. O conteúdo
inclui a conta ou canal Discord, texto e referência da imagem. Buffers e
imagens base64 muito grandes são resumidos para manter o registo legível.

Exemplo:

```text
[DRY-RUN] Would publish to facebook:
{
  "account": "main",
  "message": "ℹ️⚠️🟠 #AvisoLaranja ...",
  "media": "warnings/Twitter_Post_AvisoLaranja_....png"
}
```

As regras atuais do IPMA determinam os destinos: avisos amarelos não são
enviados para Facebook; avisos laranja e vermelhos são. O relatório diário do
tempo não tem atualmente publicação Facebook. Estas ausências são esperadas.

Se faltarem IDs de canais Discord locais, a mensagem continua a ser mostrada
com o canal identificado como `unconfigured`. Assim podes rever o conteúdo sem
copiar os IDs de produção para o Mac.

## Comparar com produção

Executa o mesmo workflow em shadow e em produção e compara texto, conta,
imagem e canal de destino. O timestamp e o `runId` agrupam as entradas da mesma
execução. Como as fontes são consultadas em tempo real, os resultados podem
mudar entre execuções. Ao recriar a base de dados shadow, os avisos ativos são
considerados novos.
