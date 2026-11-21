# DEV — Testar o `!chat` com LLM e UTCP

Este guia explica como testar a funcionalidade **`!chat <pergunta>`** num servidor Discord de teste.

> **Nota:** os planos de implementação estão em `plan/00-contrato-chat.md` a `plan/09-testes-e-rollout.md`. Este documento descreve o procedimento de teste **após esses planos serem implementados**.

## 1. Objetivo do teste

Validar que:

- o bot responde a `!chat <pergunta>`;
- o agente escolhe UTCP tools e responde com dados reais;
- não altera comandos, triggers, reações nem jobs existentes;
- não executa ações de escrita;
- em caso de erro, responde exatamente:

```text
Infelizmente não te posso responder
```

---

## 2. Pré-requisitos

- Node.js e npm instalados.
- Um servidor Discord onde tenhas permissão para adicionar bots.
- Uma conta no [OpenRouter](https://openrouter.ai/) com uma API key válida.
- Um modelo disponível no OpenRouter para usar em `LLM_MODEL`.
- Acesso local ao repositório.

Recomendações:

- usar um **servidor de teste**, não o servidor de produção;
- criar um **bot Discord novo** só para teste;
- não reutilizar o token do bot de produção;
- não fazer commit de `.env`, tokens ou credenciais.

---

## 3. Criar o bot de teste no Discord

1. Abrir [Discord Developer Portal](https://discord.com/developers/applications).
2. Clicar em **New Application** e dar um nome, por exemplo `VOSTPTia Dev`.
3. Ir a **Bot**.
4. Clicar em **Reset Token** e copiar o token.
5. Colocar esse token em `BOT_TOKEN` no `.env`.
6. Ainda em **Bot**, verificar se a opção **Message Content Intent** está ativada.  
   Se o bot ignorar mensagens, essa é a primeira causa a verificar. O bot que está configurado no `.env` chama-se **VOSTIA** (ID `1573444919530356846`); confirma que estás a editar a aplicação correta no Developer Portal.  
   Depois de ativar, guarda (**Save Changes**) e reinicia o bot. Sintoma de intent desativada: o log mostra `[DISCORD-MESSAGE] ... len=0 attachments=0`, mesmo com texto visível no Discord.
7. Ir a **OAuth2 > URL Generator**.
8. Em **Scopes**, selecionar apenas `bot`.
9. Em **Bot Permissions**, selecionar o mínimo necessário:
   - `View Channels`
   - `Send Messages`
   - `Read Message History`
10. Copiar o URL gerado e abrir no browser.
11. Convidar o bot para o servidor de testes.

Não é necessário ativar `applications.commands`: o `!chat` é um comando de mensagem, não um slash command.

---

## 4. Descobrir o ID do canal de teste

1. No Discord, ir a **User Settings > Advanced > Developer Mode** e ativar.
2. Clicar com botão direito no canal de teste.
3. Escolher **Copy Channel ID**.
4. Colocar esse ID em `LLM_ALLOWED_CHANNELS`.

Exemplo:

```dotenv
LLM_ALLOWED_CHANNELS=123456789012345678
```

Se `LLM_ALLOWED_CHANNELS` ficar vazio, o comando ficará disponível em todos os canais. Para teste, recomenda-se limitar a um canal.

---

## 5. Preparar o ambiente local

Na raiz do repositório:

```sh
cp .env.example .env
mkdir -p data/auth
```

O módulo de Corona carrega `data/auth/vostpt-bot.json` no arranque. Para teste, podes criar um ficheiro mínimo:

```sh
printf '{}\n' > data/auth/vostpt-bot.json
```

Instalar dependências:

```sh
npm install
```

Criar a base de dados local:

```sh
npx sequelize-cli db:migrate --env development
```

---

## 6. Configurar o `.env`

No `.env`, configurar pelo menos:

```dotenv
NODE_ENV=development
BETA_MODE=true
BOT_TOKEN=SEU_TOKEN_DO_BOT_DE_TESTE
COOLDOWN=10

LLM_CHAT_ENABLED=true
LLM_ALLOWED_CHANNELS=ID_DO_CANAL_DE_TESTE

LLM_PROVIDER=openrouter
OPENROUTER_TOKEN=SUA_CHAVE_OPENROUTER
LLM_API_KEY=${OPENROUTER_TOKEN}
LLM_BASE_URL=https://openrouter.ai/api/v1
LLM_MODEL=NOME_DO_MODELO_OPENROUTER
LLM_MAX_TOKENS=1200
LLM_TEMPERATURE=0.3
LLM_TIMEOUT_MS=20000
a
LLM_FALLBACK_ENABLED=true
LLM_FALLBACK_MODEL=ID_DE_MODELO_GRATUITO_OPENROUTER
LLM_FALLBACK_MAX_ATTEMPTS=1
```

Notas:

- `BETA_MODE=true` reduz os jobs ativos; ainda assim, os jobs de sismos podem correr.
- `LLM_CHAT_ENABLED=false` desativa o `!chat` sem apagar código.
- Não existe verificação prévia de créditos/saldo. Se o OpenRouter devolver 402/créditos insuficientes, o bot tenta uma vez `LLM_FALLBACK_MODEL`; se esse modelo não estiver configurado ou falhar, responde com a mensagem de erro definida.
- `LLM_API_KEY` usa `dotenv-expand` e aponta para `OPENROUTER_TOKEN`; não é necessário repetir a chave em vários sítios.
- Se `OPENROUTER_TOKEN` já estiver exportado no ambiente global, podes deixar `OPENROUTER_TOKEN=` vazio no `.env`; a referência `${OPENROUTER_TOKEN}` usa o valor global.
- `LLM_API_KEY` é a chave de chat do OpenRouter; não partilhar nem commitar.
- Para escolher um modelo, usar um ID válido do OpenRouter, por exemplo um dos modelos listados no dashboard.

---

## 7. Arrancar o bot

```sh
npm start
```

No terminal, esperar por algo como:

```text
READY :: Bot started @ ...
```

Se o bot não arrancar, verificar:

- `BOT_TOKEN` correto;
- `.env` na raiz;
- `data/auth/vostpt-bot.json` criado;
- migrações executadas;
- dependências instaladas.

---

## 8. Testes funcionais

No canal definido em `LLM_ALLOWED_CHANNELS`:

### 8.1. Comando registado

```text
?commands
```

Esperado: a lista inclui `!chat`.  
Os restantes comandos mantêm-se como antes.

Nota: `!chat` sem texto não chama o LLM. O bot menciona quem escreveu e responde com `!chat <prompt>` e três exemplos de uso.

### 8.2. Pergunta simples

```text
!chat Onde há fogo agora?
```

Esperado:

- o bot usa UTCP tools de ocorrências/fogos;
- responde em português;
- inclui fonte ou timestamp quando disponível;
- não inventa ocorrências.

### 8.3. Pergunta com histórico

```text
!chat Que fogos houve faz 3 semanas e que diarios da republica sairam nesses dias
```

Esperado, em substância:

```text
Não tenho dados históricos de fogos para esse período. Quanto aos Diários da República, só tenho acesso aos documentos recentes disponíveis neste momento.
```

O agente **não deve** inventar fogos antigos nem Diários da República antigos.

### 8.4. Memória curta

```text
!chat Quantas ocorrências há agora?
!chat E na semana passada?
```

Esperado: a segunda pergunta é interpretada no contexto da primeira, dentro de 15 minutos.

### 8.5. Erro do provider

Temporariamente, colocar uma chave inválida:

```dotenv
LLM_API_KEY=chave-invalida
```

Reiniciar o bot e enviar:

```text
!chat teste
```

Esperado:

```text
Infelizmente não te posso responder
```

Depois, restaurar a chave válida e reiniciar.

### 8.6. Fallback para modelo gratuito

Com `LLM_FALLBACK_ENABLED=true` e `LLM_FALLBACK_MODEL` preenchido, simular no teste/mock uma resposta 402 do OpenRouter no modelo principal.

Esperado:

- o agente repete a mesma pergunta uma vez com o modelo gratuito;
- a resposta final é normal;
- o utilizador não é informado do fallback;
- o detalhe fica apenas nos logs.

Se o fallback também falhar, aplica-se a mensagem padrão de erro.

### 8.7. Erro de ferramenta UTCP

Se uma tool falhar, por exemplo uma API externa indisponível, o esperado é a mesma resposta:

```text
Infelizmente não te posso responder
```

Não deve aparecer stack trace, URL interna, token ou detalhe técnico no Discord.

---

## 9. Verificar que nada existente mudou

Testar rapidamente:

```text
!all
!vost rs
?commands
```

E uma menção simples ao bot.

Esperado:

- `!all`, `!vost`, `?commands` e menções respondem como antes;
- nenhuma reação nova é adicionada pelo `!chat`;
- nenhum job de publicação em redes sociais é disparado pelo teste.

---

## 10. O que observar nos logs

Durante o teste, os logs devem mostrar:

- provider usado;
- modelo usado;
- tools UTCP chamadas;
- latência/custo aproximado;
- erros quando ocorrerem.

Os logs **não devem** conter:

- `LLM_API_KEY`;
- `BOT_TOKEN`;
- tokens de Twitter/Telegram/Mastodon/Bluesky;
- stack traces enviados ao Discord.

---

## 11. Limitações conhecidas

- Não há dados históricos de fogos.
- Os Diários da República considerados são apenas os recentes.
- Não há ferramentas de escrita, publicação ou atualização.
- Não há slash commands.
- Não há aliases para `!chat`.
- A memória é apenas em memória e desaparece quando o bot reinicia.
- Não existe verificação de saldo no OpenRouter.
- Em caso de erro, a resposta é sempre a mesma frase curta.

---

## 12. Limpeza após o teste

1. Parar o bot com `Ctrl+C`.
2. Remover o bot de teste do servidor Discord.
3. Se usaste uma chave OpenRouter apenas para teste, revogá-la no dashboard.
4. Confirmar que `.env` não foi adicionado ao Git:

```sh
git status --short
```

O `.env` não deve aparecer como ficheiro novo.

---

## 13. Checklist final

- [ ] Bot de teste criado no Discord.
- [ ] Bot convidado apenas para servidor de teste.
- [ ] `LLM_ALLOWED_CHANNELS` limitado a um canal.
- [ ] `LLM_CHAT_ENABLED=true`.
- [ ] OpenRouter configurado.
- [ ] `npm start` arranca sem erro.
- [ ] `?commands` mostra `!chat`.
- [ ] `!chat Onde há fogo agora?` responde com dados.
- [ ] Pergunta histórica recebe resposta honesta.
- [ ] Erro 402 com fallback configurado usa o modelo gratuito uma vez.
- [ ] Falha do fallback devolve exatamente `Infelizmente não te posso responder`.
- [ ] Comandos existentes continuam iguais.
- [ ] Nenhum segredo foi commitado.

---

## 14. Observabilidade (opcional)

Para enviar traces, métricas e logs para um coletor OTLP, ver `docs/observability.md`.
Sem `OTEL_EXPORTER_OTLP_ENDPOINT`, o bot não carrega o SDK e não exporta nada.

---

## 15. Agentes persistidos (`!agent` / `!agents`)

Os comandos de agentes são opcionais. Activá-los apenas depois da migração da
tabela de agentes e com `AGENTS_ENABLED=true` no `.env`. Partilham
`LLM_ALLOWED_CHANNELS` com `!chat`.

```text
!agent --help
!agent create --name "incendios" --prompt "Onde há fogos agora?" --now
!agent create --name "daqui-a-30" --prompt "Resumo de ocorrências" --in "30m"
!agent create --name "natal" --prompt "Resumo de ocorrências" --at "2026-12-25T10:00"
!agent create --name "diario" --prompt "O que diz o Diário da República?" --rrule "FREQ=DAILY;BYHOUR=13;BYMINUTE=0"
!agent create --name "incendios" --prompt "Onde há fogos agora?" --cron "0 13 * * *"
!agent create --name "segunda" --prompt "Resumo de ocorrências" --cron "0 9 * * MON" --once
!agent list
!agents
!agent update --name "diario" --prompt "Resumo do Diário da República"
!agent update --name "diario" --rrule "FREQ=DAILY;BYHOUR=14;BYMINUTE=0"
!agent cancel --name "diario"
```

Regras da CLI: `--name` e `--prompt` são obrigatórios na criação; cada criação
aceita **uma** das cinco opções de agendamento (`--now`, `--in`, `--at`,
`--rrule`, `--cron`). `--once` pode ser usado com `--rrule` ou `--cron` para
executar apenas a próxima ocorrência; RRULE com `COUNT=1` também é única.
`cancel`, `delete` e `remove` são equivalentes e apagam o agente.
Os prompts dos outros utilizadores aparecem como `(privado)`, excepto para
administradores do servidor. Com `LLM_CHAT_ONLY=true`, `!chat`, `!agent` e
`!agents` continuam disponíveis.

Referências para agendamentos:

- RRULE: https://jkbrzt.github.io/rrule/
- Cron: https://crontab.guru/
