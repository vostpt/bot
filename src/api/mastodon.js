const config = require('../config');
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const { mastodonKeys } = require('../../config/mastodon');

// Constants
const LOG_PREFIX = '[Mastodon API]';

/**
 * Custom logger for Mastodon API
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

// Default client configuration
const defaultClientMasto = {
  access_token: config.mastodon.tokens.vostpt
};

/**
 * Upload media file to Mastodon
 * @param {Object} fileObject - File object containing the media
 * @param {Buffer|string} fileObject.name - File content or path
 * @param {string} [reference='main'] - Mastodon account reference
 * @returns {Promise<Object|null>} Uploaded media object or null if upload fails
 */
const uploadMedia = async (fileObject, reference) => {
if(!config.mastodon.enabled) {
    logger.warning('Mastodon service is disabled');
    return;
  }
  const client = mastodonKeys[reference] ? mastodonKeys[reference] : defaultClientMasto;
  const url = `${client.api_url}/v2/media`;
  
  logger.debug(`Preparing to upload media to ${url}`);
  
  const nodeBuf = Buffer.from(fileObject.name);
  const formData = new FormData();
  formData.append('file', nodeBuf, 'image.png');

  try {
    logger.debug('Sending media upload request');
    const res = await axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    });
    
    logger.info('Media upload successful');
    return res.data;
  } catch (err) {
    if (err.response) {
      logger.error('API response error', {
        data: err.response.data,
        status: err.response.status,
        headers: err.response.headers
      });
    } else if (err.request) {
      logger.error('API request error', err.request);
    } else {
      logger.error('Request configuration error', err.message);
    }
    logger.debug('Failed request config:', err.config);
    return null;
  }
};

/**
 * Post a status to Mastodon
 * @param {Object} postObject - Post data
 * @param {string} postObject.status - The text content of the post
 * @param {string[]} [postObject.media_ids] - Array of media IDs to attach
 * @param {Object} [postObject.options] - Additional posting options
 * @param {string} [reference='main'] - Mastodon account reference
 * @returns {Promise<void>}
 */
const postStatus = async (postObject, reference) => {
if(!config.mastodon.enabled) {
    logger.warning('Mastodon service is disabled');
    return;
  }
  const client = mastodonKeys[reference] ? mastodonKeys[reference] : defaultClientMasto;
  const url = `${client.api_url}/v1/statuses`;

  logger.debug(`Preparing to post status to ${url}`);
  logger.debug('Post content:', { ...postObject, status: postObject.status.substring(0, 50) + '...' });

  try {
    logger.debug('Sending post request');
    const res = await axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${client.access_token}`,
      },
      data: postObject,
    });
    
    logger.info('Status posted successfully');
    return res.data;
  } catch (err) {
    if (err.response) {
      logger.error('API response error', {
        data: err.response.data,
        status: err.response.status,
        headers: err.response.headers
      });
    } else if (err.request) {
      logger.error('API request error', err.request);
    } else {
      logger.error('Request configuration error', err.message);
    }
    logger.debug('Failed request config:', err.config);
    throw err;
  }
};

module.exports = {
  uploadMedia,
  postStatus,
};
