# VOSTPT Discord bot

[![Build Status](https://travis-ci.com/vostpt/bot.svg?branch=master)](https://travis-ci.com/vostpt/bot)
[![Coverage Status](https://coveralls.io/repos/github/vostpt/bot/badge.svg?branch=master)](https://coveralls.io/github/vostpt/bot?branch=master)

## Instalação
Antes de mais, instala as dependências:
```sh
yarn install
```

Ou caso prefiras `npm`:
```sh
npm install
```

## Configuração
Após instalar as dependências, é altura de fazer uma configuração rápida.

Cria um ficheiro `.env` na raiz do projeto.

```sh
cp .env.example .env
```

E edita os valores necessários:

```
#
# Token do bot
#
BOT_TOKEN=

#
# Os canais para onde as respetivas mensagens devem ser enviadas
#
MAIN_CHANNEL_ID=
EARTHQUAKES_CHANNEL_ID=
FIRES_CHANNEL_ID=
WARNINGS_CHANNEL_ID=
TRIGGERS_CHANNEL_ID=

#
# Configurações do Twitter
#
TWITTER_CONSUMER_KEY=
TWITTER_CONSUMER_SECRET=
TWITTER_ACCESS_TOKEN_KEY=
TWITTER_ACCESS_TOKEN_SECRET=
```

## Arrancar o bot
Se já percorreste todos os passos anteriores, deves ter tudo pronto para arrancar o bot. Para isso, basta executar:

```sh
npm start
```

Deve aparecer algo do género no terminal:
```sh
READY :: Bot started @ 2019-4-14 21:27:00
```

E já está!
