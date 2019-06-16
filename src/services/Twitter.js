const Twit = require('twit');
const path = require('path');

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
* Post tweet with text and photo
*
* @async
* @param {String} tweetText
* @param {String} photoFileName
*/
const uploadTweetPhoto = async (tweetText, photoFileName) => {
  let folderPath = path.resolve('./src/images');
  folderPath += path.sep;
  const photoPath = folderPath.concat(photoFileName);

  clientTwitter.postMediaChunked({ file_path: photoPath }, (errorChk, dataChk, responseChk) => {
    if (!errorChk && responseChk !== '') {
      const mediaIdStr = dataChk.media_id_string;
      const metaParams = { media_id: mediaIdStr };

      clientTwitter.post('media/metadata/create', metaParams, (error, data, response) => {
        if (!error && response !== '') {
          const params = { status: tweetText, media_ids: [mediaIdStr] };

          clientTwitter.post('statuses/update', params);
        }
      });
    }
  });
};

module.exports = {
  clientTwitter,
  uploadTweetPhoto,
};
