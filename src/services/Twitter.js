const Twit = require('twit');
const path = require('path');
const fs = require('fs');
const { getFileContent, isBase64 } = require('../helpers');

const {
  TWITTER_CONSUMER_KEY,
  TWITTER_CONSUMER_SECRET,
  TWITTER_ACCESS_TOKEN_KEY,
  TWITTER_ACCESS_TOKEN_SECRET,
} = process.env;

const clientTwitter = new Twit({
  consumer_key: TWITTER_CONSUMER_KEY,
  consumer_secret: TWITTER_CONSUMER_SECRET,
  access_token: TWITTER_ACCESS_TOKEN_KEY,
  access_token_secret: TWITTER_ACCESS_TOKEN_SECRET,
});

/**
* Recursive function
* Send a thread to Twitter
* Each tweet can have text and photos or only text
*
* @async
* @param {Array<Object>} tweetSeq
* @param {String} tweetId
*/
const uploadThreadTwitter = (tweetSeq, tweetId = '') => {
  if (tweetSeq.length === 0) {
    return;
  }

  const tweetToSend = tweetSeq.shift();

  const uploadedMedia = tweetToSend.media !== undefined
    ? tweetToSend.media.map((filedata) => {
      const fileContent = getFileContent(filedata);

      return clientTwitter.post('media/upload', { media_data: fileContent });
    })
    : [];

  Promise.all(uploadedMedia).then((results) => {
    const mediaIds = results.map(({ data }) => {
      const { media_id_string: mediaId } = data;

      clientTwitter.post('media/metadata/create', { media_id: mediaId });

      return mediaId;
    });

    const params = {
      status: tweetToSend.status,
      media_ids: mediaIds,
      in_reply_to_status_id: tweetId,
    };

    clientTwitter.post('statuses/update', params, (err, data, response) => {
      if (!err && response !== '') {
        uploadThreadTwitter(tweetSeq, data.id_str);
      }
    });
  });
};

/**
* Post tweet with text and photos
* photoData input can receive both file buffer or filename string arrays
*
* @async
* @param {String} status
* @param {Array<String|Buffer>} photoData
*/
const uploadTweetPhotos = async (status, photoData) => {
  const uploadedMedia = photoData.map((filedata) => {
    const fileContent = isBase64(filedata)
      ? filedata
      : fs.readFileSync(`${path.resolve('./src/images')}${path.sep}${filedata}`, { encoding: 'base64' });

    return clientTwitter.post('media/upload', { media_data: fileContent });
  });

  Promise.all(uploadedMedia).then((results) => {
    const mediaIds = results.map(({ data }) => {
      const { media_id_string: mediaId } = data;

      clientTwitter.post('media/metadata/create', { media_id: mediaId });

      return mediaId;
    });

    clientTwitter.post('statuses/update', { status, media_ids: mediaIds });
  });
};

/**
* Retweet last fogos.pt tweet
*
* @async
* @param {String} tweetText
*/
const retweetFogosPtStatTweet = async (tweetText = '') => {
  const searchParams = {
    screen_name: 'FogosPt',
    count: '20',
  };

  clientTwitter.get('statuses/user_timeline', searchParams, (err, data, response) => {
    if (!err && response !== '') {
      const statTweet = data.find(tweet => tweet.text.includes(tweetText));

      const tweetId = statTweet.id_str;

      const params = {
        id: tweetId,
        trim_user: true,
      };

      clientTwitter.post('statuses/retweet/:id', params);
    }
  });
};

module.exports = {
  clientTwitter,
  uploadTweetPhotos,
  uploadThreadTwitter,
  retweetFogosPtStatTweet,
};
