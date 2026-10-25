# Bot VOSTPT

Este projeto executa o bot Discord da VOSTPT e os processos agendados que
publicam informação nas redes sociais.

## Requisitos e instalação

Usa Node.js 20 ou 22. Instala as dependências:

```sh
npm ci
```

Cria a configuração local a partir do exemplo:

```bash
cp .env.example .env
```

Preenche as credenciais e os IDs dos canais necessários. A lista completa e as
opções para ativar/desativar tarefas estão em `.env.example`. Não guardes
segredos no Git.

## Executar o bot

Aplica as migrações da base de dados de desenvolvimento e inicia o bot:

```sh
npx sequelize-cli db:migrate --env development
npm start
```

Os comandos slash são registados no servidor configurado por `CLIENT_ID` e
`GUILD_ID`:

```sh
npm run commands:deploy
```

Para usar triggers e os comandos prefixados que ainda existem, ativa a intenção
privilegiada Message Content na aplicação Discord. O comando Corona fica
excluído do registo slash.

## Pré-visualizar publicações em segurança

Para consultar os dados atuais e imprimir as publicações que seriam feitas,
usa o [modo shadow](./pt-shadow-mode.md). Este modo usa uma base de dados SQLite
isolada e regista as saídas previstas para Discord, Twitter/X, Mastodon,
Facebook, Telegram e Bluesky sem as publicar.

```sh
npm run shadow
npm run shadow -- warnings weather
npm run shadow:watch
```

## Testes

Executa toda a suite de testes:

```sh
npm test -- --runInBand
```

Executa os testes offline de arranque e dos adaptadores:

```sh
npm run test:smoke
```

Os testes live opcionais autenticam-se nas APIs selecionadas, mas não publicam
mensagens. Ativa-os explicitamente e escolhe os serviços:

```sh
LIVE_SMOKE_TESTS=true LIVE_SMOKE_TARGETS=discord,twitter,telegram npm run test:smoke:live
```

Verifica o estilo do código:

```sh
npm run lint -- src/ config/ scripts/
```

Consulta [Modo shadow](./pt-shadow-mode.md) e [Testes](./pt-testing.md) para
mais detalhes.
