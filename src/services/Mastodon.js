const Mastodon = require('mastodon-api');
const fs = require('fs');

const {
  accessToken,
  mastodonURL,
} = require('../../config/mastodon');

const { getImagesPath } = require('../helpers');

const client = new Mastodon({
  access_token: accessToken,
  api_url: mastodonURL,
});

/**
* Send a message to Mastodon/Pleroma
*
* @async
* @param {Object} message
*/

const sendPostMastodon = async (post) => {
  const filePath = `${getImagesPath()}${post.media}`;

  client.post('media', { file: fs.createReadStream(filePath) }).then((resp) => {
    const { id } = resp.data;

    client.post('statuses', { status: post.status, media_ids: [id], ...post.options });
  });
};

module.exports = {
  sendPostMastodon,
};
