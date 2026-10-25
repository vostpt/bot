# Testes e verificações

Executa os comandos na raiz do projeto com Node.js 20 ou 22.

## Suite completa de testes

```sh
npm test -- --runInBand
```

Executa testes unitários e smoke tests offline. Os serviços externos são
simulados; a suite não publica mensagens.

## Smoke tests offline

```sh
npm run test:smoke
```

Verificam o carregamento dos módulos principais e os contratos dos adaptadores
de redes sociais usando mocks.

## Verificações live opcionais

As verificações live fazem pedidos de autenticação/identidade só de leitura e
não criam publicações. É obrigatório ativar explicitamente
`LIVE_SMOKE_TESTS=true`:

```sh
LIVE_SMOKE_TESTS=true npm run test:smoke:live
```

Para escolher apenas alguns serviços:

```sh
LIVE_SMOKE_TESTS=true LIVE_SMOKE_TARGETS=discord,twitter,mastodon npm run test:smoke:live
```

Os nomes disponíveis são `discord`, `twitter`, `mastodon`, `facebook`,
`telegram` e `bluesky`. Sem uma lista, são verificados os serviços que tiverem
credenciais configuradas. Se faltar a credencial de um serviço pedido, a
verificação falha e identifica-o.

## Lint

```sh
npm run lint -- src/ config/ scripts/
```

A configuração atual apresenta os registos `console` existentes como avisos.
O lint falha apenas quando encontra erros.

## Pré-visualizar publicações

Usa o [Modo shadow](./pt-shadow-mode.md) para construir mensagens com dados
atuais e registar o que seria publicado sem enviar nada.
