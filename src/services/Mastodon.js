const {
  uploadMedia,
  postStatus,
} = require('../api/Mastodon');

const { getImagesPath } = require('../helpers');

/**
* Send a message to Mastodon/Pleroma
* For now the max number of photos to include in a post is 1
*
* @async
* @param {Object} message
*/

const sendPostMastodon = async (post, reference = 'main') => {
  const mediaIds = [];

  if (post.media !== undefined) {
    const filePath = `${getImagesPath()}${post.media}`;

    const fileObject = {
      name: post.media,
      path: filePath,
    };

    const result = await uploadMedia(fileObject, reference);

    mediaIds.push(result.id);
  }

  postStatus({
    status: post.status,
    media_ids: mediaIds,
    ...post.options,
  }, reference);
};

module.exports = {
  sendPostMastodon,
};
