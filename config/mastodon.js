const mastodonURL = 'https://trombas.vost.pt/api';

const mastodonKeys = {
  main: {
    access_token: process.env.VOSTPT_ACCESS_TOKEN,
    api_url: mastodonURL,
  },
  dre: {
    access_token: process.env.PTDRE_ACCESS_TOKEN,
    api_url: mastodonURL,
  },
};

module.exports = {
  mastodonKeys,
};
