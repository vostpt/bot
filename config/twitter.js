const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  TWITTER_AZ_CONSUMER_KEY,
  TWITTER_AZ_CONSUMER_SECRET,
  TWITTER_AZ_ACCESS_TOKEN_KEY,
  TWITTER_AZ_ACCESS_TOKEN_SECRET,
  TWITTER_EU_CONSUMER_KEY,
  TWITTER_EU_CONSUMER_SECRET,
  TWITTER_EU_ACCESS_TOKEN_KEY,
  TWITTER_EU_ACCESS_TOKEN_SECRET,
  TWITTER_DRE_CONSUMER_KEY,
  TWITTER_DRE_CONSUMER_SECRET,
  TWITTER_DRE_ACCESS_TOKEN_KEY,
  TWITTER_DRE_ACCESS_TOKEN_SECRET,
  TWITTER_RALLY_CONSUMER_KEY,
  TWITTER_RALLY_CONSUMER_SECRET,
  TWITTER_RALLY_ACCESS_TOKEN_KEY,
  TWITTER_RALLY_ACCESS_TOKEN_SECRET,
} = process.env;

const twitterKeys = [{
  reference: 'main',
  screenName: 'VOSTPT',
  fetchTweets: true,
  keys: {
    consumer_key: TWITTER_CONSUMER_KEY,
    consumer_secret: TWITTER_CONSUMER_SECRET,
    access_token: TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
  },
},
{
  reference: 'azores',
  screenName: 'VOSTAZ',
  fetchTweets: true,
  keys: {
    consumer_key: TWITTER_AZ_CONSUMER_KEY,
    consumer_secret: TWITTER_AZ_CONSUMER_SECRET,
    access_token: TWITTER_AZ_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_AZ_ACCESS_TOKEN_SECRET,
  },
},
{
  reference: 'europe',
  screenName: 'VOSTeurope',
  fetchTweets: false,
  keys: {
    consumer_key: TWITTER_EU_CONSUMER_KEY,
    consumer_secret: TWITTER_EU_CONSUMER_SECRET,
    access_token: TWITTER_EU_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_EU_ACCESS_TOKEN_SECRET,
  },
},
{
  reference: 'dre',
  screenName: 'Portugal_DRE',
  fetchTweets: false,
  keys: {
    consumer_key: TWITTER_DRE_CONSUMER_KEY,
    consumer_secret: TWITTER_DRE_CONSUMER_SECRET,
    access_token: TWITTER_DRE_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_DRE_ACCESS_TOKEN_SECRET,
  },
},
{
  reference: 'rally',
  screenName: '!Rally',
  fetchTweets: false,
  keys: {
    consumer_key: TWITTER_RALLY_CONSUMER_KEY,
    consumer_secret: TWITTER_RALLY_CONSUMER_SECRET,
    access_token: TWITTER_RALLY_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_RALLY_ACCESS_TOKEN_SECRET,
  },
}];

module.exports = {
  twitterKeys,
};
