const { cooldown, llmChatEnabled, llmChatChannels } = require('../../config/bot');
const { withSpan, count, observe, emitLog } = require('../telemetry');
const { sendMessageAnswer, sendMessageToChannel } = require('../services/Discord');
const memory = require('../services/llm/memory');
const { resolveDateRange } = require('../services/llm/time');
const { runChat } = require('../services/llm/orchestrator');

const ERROR_MESSAGE = 'Infelizmente não te posso responder';

const EMPTY_MESSAGE = [
  'Tens de escrever algo depois de `!chat`: `!chat <prompt>`.',
  '',
  'Exemplos:',
  '`!chat Onde há fogos agora?`',
  '`!chat Houve sismos sentidos hoje?`',
  '`!chat O que significa ANPC?`',
].join('\n');

const mentionFor = (message) => {
  const author = message && message.author;

  if (!author) {
    return '';
  }

  if (message.local) {
    return `@${author.username || author.id || 'utilizador'}`;
  }

  if (author.id) {
    return `<@${author.id}>`;
  }

  return author.username ? `@${author.username}` : '';
};

const errorReply = (message) => `${mentionFor(message)} ${ERROR_MESSAGE}`.trim();
const emptyReply = (message) => `${mentionFor(message)} ${EMPTY_MESSAGE}`.trim();

module.exports = {
  name: 'chat',
  active: llmChatEnabled,
  args: true,
  cooldown,
  limitToChannels: llmChatChannels,
  usage: '**!chat <prompt>** - Faz uma pergunta ao VOSTPTia com dados acessíveis via UTCP.',

  async execute(message, args) {
    const question = Array.isArray(args) ? args.join(' ').trim() : String(args || '').trim();
    const channel = message.channel;

    return withSpan('chat.command', {
      attributes: {
        'chat.channel.id': channel && channel.id,
        'chat.question.length': question.length,
      },
    }, async (span) => {
      let answered = false;
      const started = process.hrtime.bigint();

      try {
        if (!question) {
          count('chatRequests', { result: 'empty' });
          await sendMessageToChannel(channel, emptyReply(message));
          return;
        }

        const key = memory.buildKey(channel.id, message.author.id);
        let history = [];

        try {
          history = memory.getHistory(key);
        } catch (error) {
          console.warn('Memória do chat indisponível na leitura');
        }

        const dateContext = resolveDateRange(question);
        const { answer } = await runChat({ question, history, dateContext });

        await sendMessageAnswer(message, answer);
        answered = true;
        count('chatRequests', { result: 'ok' });

        try {
          memory.append(key, 'user', question);
          memory.append(key, 'assistant', answer);
        } catch (error) {
          console.warn('Memória do chat indisponível na escrita');
        }
      } catch (error) {
        console.error(error);
        count('chatRequests', { result: 'error' });
        emitLog('chat.failed', {
          severity: 'ERROR',
          message: 'Falha ao responder !chat',
          attributes: {
            'error.message': error && error.message ? String(error.message) : 'erro desconhecido',
          },
        });

        if (span && error instanceof Error) {
          span.recordException(error);
        }

        if (!answered) {
          await sendMessageToChannel(channel, errorReply(message));
        }
      } finally {
        observe('chatDuration', Number(process.hrtime.bigint() - started) / 1e9);
      }
    });
  },
};

module.exports.ERROR_MESSAGE = ERROR_MESSAGE;
module.exports.EMPTY_MESSAGE = EMPTY_MESSAGE;
module.exports.errorReply = errorReply;
module.exports.emptyReply = emptyReply;
