const actualDiscord = jest.requireActual('discord.js');

module.exports = {
  ...actualDiscord,
  Client: jest.fn(() => ({
    message: {
      reply: jest.fn(),
      react: jest.fn(),
      channel: {
        send: jest.fn(),
      },
    },
  })),
};
