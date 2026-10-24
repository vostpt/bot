const { TwitterApi } = require('twitter-api-v2');
const FileType = require('file-type');
const { getFileContent } = require('../helpers');
const { twitterKeys } = require('../../config/twitter');

const clients = new Map();

const hasCredentials = ({ keys }) => [
  keys.consumer_key,
  keys.consumer_secret,
  keys.access_token,
  keys.access_token_secret,
].every(Boolean);

const getTwitterClient = (reference = 'main') => {
  const account = twitterKeys.find((item) => item.reference === reference)
    || twitterKeys.find((item) => item.reference === 'main');

  if (!account || !hasCredentials(account)) {
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

  const clientTwitter = getTwitterClient(reference);

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
    }
  }
};


// Intentionally disabled: this was already disabled on master.
const tweetVostEu = async () => ({ skipped: true, reason: 'disabled' });

module.exports = {
  getTwitterClient,
  uploadThreadTwitter,
  tweetVostEu,
};
