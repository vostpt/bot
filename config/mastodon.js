const mastodonURL = 'https://masto.pt/api/v1';

const pleromaURL = 'https://pleroma.pt/api/v1';

const mastodonKeys = {
  main: {
    access_token: process.env.MASTODON_ACCESS_TOKEN,
    api_url: mastodonURL,
  },
  dre: {
    access_token: process.env.PTDRE_PLEROMA_ACCESS_TOKEN,
    api_url: pleromaURL,
  },
};

module.exports = {
  mastodonKeys,
};
