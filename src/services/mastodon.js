const config = require('../config');
const { uploadMedia, postStatus } = require('../api/Mastodon');
const { getImagesPath, getFileContent } = require('../helpers');

// Constants
const LOG_PREFIX = '[Mastodon]';
const MAX_MEDIA_PER_POST = 1;

/**
 * Custom logger for Mastodon service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Upload media to Mastodon
 * @param {string} mediaPath - Path to media file
 * @param {string} reference - Mastodon account reference
 * @returns {Promise<string>} Media ID
 */
const uploadMediaToMastodon = async (mediaPath, reference) => {
  try {
    const filePath = `${getImagesPath()}${mediaPath}`;
    const media = getFileContent(mediaPath);
    
    const fileObject = {
      name: media,
      path: filePath,
    };

    const result = await uploadMedia(fileObject, reference);
    logger.info(`Media uploaded successfully: ${mediaPath}`);
    
    return result.id;
  } catch (error) {
    logger.error(`Failed to upload media: ${mediaPath}`, error);
    throw error;
  }
};

/**
 * Send a message to Mastodon/Pleroma
 * @param {Object} post - Post data
 * @param {string} post.status - Post content
 * @param {string} [post.media] - Media file path
 * @param {Object} [post.options] - Additional post options
 * @param {string} [reference='main'] - Mastodon account reference
 */
const sendPostMastodon = async (post, reference = 'main') => {
  try {
    const mediaIds = [];

    if (post.media) {
      const mediaId = await uploadMediaToMastodon(post.media, reference);
      mediaIds.push(mediaId);
    }

    await postStatus({
      status: post.status,
      media_ids: mediaIds,
      ...post.options,
    }, reference);

    logger.info(`Post sent successfully${post.media ? ' with media' : ''}`);
  } catch (error) {
    logger.error('Failed to send post to Mastodon', error);
    throw error;
  }
};

/**
 * Send a thread of posts to Mastodon
 * @param {Array<Object>} thread - Array of post data
 * @param {string} [reference='main'] - Mastodon account reference
 */
const uploadThreadMastodon = async (thread, reference = 'main') => {
  if (!config.mastodon.enabled) {
    logger.warning('Mastodon service is disabled');
    return;
  }
  if (!thread || thread.length === 0) {
    logger.warning('Empty thread provided');
    return;
  }

  try {
    logger.info(`Starting to upload thread with ${thread.length} posts`);

    for (const post of thread) {
      await sendPostMastodon(post, reference);
    }

    logger.info('Thread uploaded successfully');
  } catch (error) {
    logger.error('Failed to upload thread to Mastodon', error);
    throw error;
  }
};

module.exports = {
  sendPostMastodon,
  uploadThreadMastodon,
};
