const Twit = require('twit');
const path = require('path');
const fs = require('fs');

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
* Post tweet with text and photos
*
* @async
* @param {String} status
* @param {Array<String>} photoFileNames
*/
const uploadTweetPhotos = async (status, photoFileNames) => {
  const uploadedMedia = photoFileNames.map((filename) => {
    const fileContent = fs.readFileSync(`${path.resolve('./src/images')}${path.sep}${filename}`, { encoding: 'base64' });

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

module.exports = {
  clientTwitter,
  uploadTweetPhotos,
};
