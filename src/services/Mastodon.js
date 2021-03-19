const {
  uploadMedia,
  postStatus,
} = require('../api/Mastodon');

const { getImagesPath } = require('../helpers');

/**
* Send a message to Mastodon/Pleroma
*
* @async
* @param {Object} message
*/

const sendPostMastodon = async (post, reference = 'dre') => {
  if (post.media !== undefined) {
    const filePath = `${getImagesPath()}${post.media}`;

    const fileObject = {
      name: post.media,
      path: filePath,
    };

    const result = await uploadMedia(fileObject, reference);

    const mediaId = result.id;

    postStatus({
      status: post.status,
      media_ids: [mediaId],
      ...post.options,
    }, reference);

    return;
  }

  postStatus(post, reference);
};

module.exports = {
  sendPostMastodon,
};
