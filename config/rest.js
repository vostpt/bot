const { REST_TOKEN } = process.env;

const isActive = REST_TOKEN && REST_TOKEN !== '';

module.exports = {
  isActive,
  token: REST_TOKEN,
  port: 3000,
};
