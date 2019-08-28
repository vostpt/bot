module.exports = {
  Client: jest.fn(() => ({
    message: {
      author: {
        send: jest.fn(),
      },
      reply: jest.fn(),
      react: jest.fn(),
      channel: {
        send: jest.fn(),
      },
      guild: {
        roles: [],
      },
      member: {
        roles: [],
      },
    },
  })),
};
