const { TwitterApi } = require('twitter-api-v2');
const FileType = require('file-type');
const { getFileContent } = require('../helpers');
const { isDryRun, skipSocialPost, recordPublication } = require('../helpers/publicationLog');
const { twitterKeys } = require('../../config/twitter');

const clients = new Map();

const hasCredentials = (keys) => Boolean(
  keys
  && keys.consumer_key
  && keys.consumer_secret
  && keys.access_token
  && keys.access_token_secret,
);

const accountHasCredentials = (account) => hasCredentials(account && account.keys);

const warnDisabled = () => {
  console.warn('Twitter desativado: credenciais não configuradas');
};

// Used when credentials are absent, so startup and jobs do not crash in
// local/test environments. No credentials means no network calls.
const disabledClient = {
  v1: {
    uploadMedia: async () => {
      warnDisabled();
      return null;
    },
  },
  v2: {
    tweet: async () => {
      warnDisabled();
      return { data: {} };
    },
  },
  post: async () => {
    warnDisabled();
    return { data: {} };
  },
};

const createClient = (account) => {
  if (!accountHasCredentials(account)) {
    return null;
  }

  return new TwitterApi({
    appKey: account.keys.consumer_key,
    appSecret: account.keys.consumer_secret,
    accessToken: account.keys.access_token,
    accessSecret: account.keys.access_token_secret,
  });
};

const twitterClients = twitterKeys.map((account) => ({
  reference: account.reference,
  screenName: account.screenName,
  fetchTweets: account.fetchTweets,
  client: createClient(account),
}));

const defaultClientTwitter = twitterClients.find((element) => element.reference === 'main');

const vostEuTweets = {
  1: [{
    status: `☁️🌂🌀❄️🌊
⚠ Weather warnings\n⚠ Avisos meteorológicos\n⚠ Alertes météo\n⚠ Wetterwarnungen\n⚠ Allerte meteo
#SevereWeather\n\n#SMEM #MSGU #RSGE\n\nhttps://meteoalarm.org`,
    media: ['vost_eu/daily_tweets/DAILY_TWEETS_METEOALARM.png'],
  }],
  2: [{
    status: `📌 ECHO Daily Flash of the European Emergency Response Coordination Centre 📢 #ERCC
@eu_echo\n\n#EUCivPro #RescEU\n#SMEM #MSGU #RSGE\nhttp://erccportal.jrc.ec.europa.eu/ECHO-Flash`,
    media: ['vost_eu/daily_tweets/DAILY_TWEETS_ECHOFLASH.png'],
  }],
};

/**
 * Strict, cached, reference-aware client lookup. Kept for callers that want an
 * explicit configuration error instead of the no-op disabled client.
 */
const getTwitterClient = (reference = 'main') => {
  const account = twitterKeys.find((item) => item.reference === reference)
    || twitterKeys.find((item) => item.reference === 'main');

  if (!account || !accountHasCredentials(account)) {
    throw new Error(`Twitter credentials are not configured for account "${reference}"`);
  }

  if (!clients.has(account.reference)) {
    clients.set(account.reference, new TwitterApi({
      appKey: account.keys.consumer_key,
      appSecret: account.keys.consumer_secret,
      accessToken: account.keys.access_token,
      accessSecret: account.keys.access_token_secret,
    }));
  }

  return clients.get(account.reference);
};

/**
 * Publication path: gracefully falls back to a no-op client when credentials
 * are absent so local/test jobs never crash.
 */
const resolveClient = (reference = 'main') => {
  const account = twitterClients.find((item) => item.reference === reference);
  const client = (account && account.client)
    || (defaultClientTwitter && defaultClientTwitter.client)
    || disabledClient;

  if (client === disabledClient) {
    warnDisabled();
  }

  return client;
};

/**
* Recursive function
* Send a thread to Twitter
* Each tweet can have text and photos or only text
*
* @async
* @param {Array<Object>} tweetSeq
* @param {String} tweetId
* @param {String} reference
*/
const uploadThreadTwitter = async (tweetSeq, _tweetId = '', reference = 'main') => {
  void _tweetId;

  if (tweetSeq.length === 0) {
    return;
  }

  if (skipSocialPost('TWITTER', reference)) return { skipped: true, reason: 'social-posts-disabled' };

  if (isDryRun()) {
    return Promise.all(tweetSeq.map((tweet, index) => recordPublication('twitter', {
      account: reference,
      sequence: index + 1,
      sequenceLength: tweetSeq.length,
      text: tweet.status,
      media: tweet.media || [],
    })));
  }

  const clientTwitter = resolveClient(reference);

  for (let i = 0; i < tweetSeq.length; i += 1) {
    const tweetToSend = tweetSeq[i];
    const uploadedMedia = tweetToSend.media && tweetToSend.media.length > 0
      ? await Promise.all(tweetToSend.media.map(async (filedata) => {
        const fileContent = getFileContent(filedata);
        const detected = await FileType.fromBuffer(fileContent);
        const mediaType = detected?.mime || 'image/png';
        const media = await clientTwitter.v1.uploadMedia(fileContent, { mimeType: mediaType });
        return media;
      }))
      : [];

    const params = {
      text: tweetToSend.status,
      media: uploadedMedia.length > 0 ? { media_ids: uploadedMedia } : undefined,
    };

    const response = await clientTwitter.v2.tweet(params);
    if (response.data.errors) {
      console.error(response.data.errors);
      throw new Error(`Twitter rejected the post: ${JSON.stringify(response.data.errors)}`);
    }
  }
};

// Timeline fetching via v1.1 is intentionally disabled: unavailable in the
// Twitter API v2 free tier. The daily VOST EU threads are kept above for the
// scheduled jobs that call tweetVostEu(1) and tweetVostEu(2).
const tweetVostEu = async (tweetId) => {
  const thread = vostEuTweets[tweetId];
  void thread;

  return { skipped: true, reason: 'disabled', tweetId };
};

module.exports = {
  getTwitterClient,
  clientTwitter: (defaultClientTwitter && defaultClientTwitter.client) || disabledClient,
  twitterClients,
  vostEuTweets,
  uploadThreadTwitter,
  tweetVostEu,
};
