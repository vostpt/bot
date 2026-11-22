/**
 * Test-only placeholders for the Twitter accounts constructed at require time
 * by src/services/Twitter.js. The local .env intentionally has no real tokens;
 * these values are never used to make network calls in the test suite.
 */
const prefixes = [
  'TWITTER_',
  'TWITTER_AZ_',
  'TWITTER_EU_',
  'TWITTER_IA_',
  'TWITTER_DRE_',
  'TWITTER_RALLY_',
];

const suffixes = [
  'CONSUMER_KEY',
  'CONSUMER_SECRET',
  'ACCESS_TOKEN_KEY',
  'ACCESS_TOKEN_SECRET',
];

prefixes.forEach((prefix) => {
  suffixes.forEach((suffix) => {
    const name = `${prefix}${suffix}`;

    if (!process.env[name]) {
      process.env[name] = 'test-placeholder';
    }
  });
});
