const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
  TWITTER_AZ_CONSUMER_KEY,
  TWITTER_AZ_CONSUMER_SECRET,
  TWITTER_AZ_ACCESS_TOKEN_KEY,
  TWITTER_AZ_ACCESS_TOKEN_SECRET,
} = process.env;

const twitterKeys = [{
  reference: 'main',
  screenName: 'VOSTPT',
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
  keys: {
    consumer_key: TWITTER_AZ_CONSUMER_KEY,
    consumer_secret: TWITTER_AZ_CONSUMER_SECRET,
    access_token: TWITTER_AZ_ACCESS_TOKEN_KEY,
    access_token_secret: TWITTER_AZ_ACCESS_TOKEN_SECRET,
  },
}];

module.exports = {
  twitterKeys,
};
