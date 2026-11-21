const readline = require('readline');

const messageEvent = require('./message');
const { llmChatChannels } = require('../../config/bot');

const CHANNEL_ID = llmChatChannels[0] || 'local-console';
const AUTHOR_ID = 'local-user';

const print = (text) => {
  // eslint-disable-next-line no-console
  console.log(`[VOSTPTia] ${text}`);
};

const startLocalInput = (client) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: 'chat> ',
  });

  const channel = {
    id: CHANNEL_ID,
    send: async (text) => {
      print(text);
      return { attachments: [] };
    },
  };

  const author = {
    id: AUTHOR_ID,
    username: 'local',
    bot: false,
    send: async (text) => {
      print(text);
      return { attachments: [] };
    },
  };

  const msgFor = (content) => ({
    content,
    channel,
    author,
    local: true,
    isMemberMentioned: () => false,
    reply: async (text) => {
      print(text);
      return { attachments: [] };
    },
    react: () => {},
  });

  rl.on('line', async (line) => {
    const text = String(line || '').trim();

    if (text === '' || text === '.' || text === '..') {
      rl.prompt();
      return;
    }

    if (text === 'exit' || text === '.exit') {
      // eslint-disable-next-line no-console
      console.log('Local input encerrado; o bot continua ligado ao Discord.');
      rl.close();
      return;
    }

    if (text === 'quit' || text === '.quit') {
      rl.close();
      client.destroy();
      process.exit(0);
      return;
    }

    const timestamps = client.cooldowns && client.cooldowns.get('chat');

    if (timestamps && timestamps.has(AUTHOR_ID)) {
      timestamps.delete(AUTHOR_ID);
    }

    const content = text.startsWith('!') ? text : `!chat ${text}`;

    try {
      await messageEvent(client, msgFor(content));
    } catch (error) {
      console.error('Erro no input local:', error);
    }

    rl.prompt();
  });

  rl.on('SIGINT', () => {
    rl.close();
    client.destroy();
    process.exit(0);
  });

  rl.prompt();

  return rl;
};

module.exports = {
  startLocalInput,
  CHANNEL_ID,
  AUTHOR_ID,
};
