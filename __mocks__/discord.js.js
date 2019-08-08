module.exports = {
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
