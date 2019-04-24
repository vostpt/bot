module.exports = {
  Client: jest.fn(() => ({
    message: {
      reply: jest.fn(),
      channel: {
        send: jest.fn(),
      },
    },
  })),
};
