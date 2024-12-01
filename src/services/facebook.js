const { FACEBOOK } = require('../config/services');
const facebookSdk = require('facebook-nodejs-business-sdk');
const { facebookKeys, defaultReference } = require('../../config/facebook');
const { baseImagesURL } = require('../../config/api');

// Constants
const LOG_PREFIX = '[Facebook]';

/**
 * Custom logger for Facebook service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Get Facebook client for specific account
 * @param {String} reference - Account reference
 * @returns {Object} Facebook client configuration
 */
const loadAccountFromReference = (reference = defaultReference) => {
  const clientToUse = facebookKeys.find(account => account.reference === reference);
  if (!clientToUse) {
    logger.error(`No Facebook client found for reference: ${reference}`);
    throw new Error('Invalid Facebook client reference');
  }
  return clientToUse;
};

/**
 * Initialize Facebook API client
 * @param {Object} clientConfig - Client configuration
 * @returns {Object} Facebook API instance
 */
const initializeFacebookApi = (clientConfig) => {
  if (FACEBOOK || !FACEBOOK.enabled) {
    return null;
  }
  const api = facebookSdk.FacebookAdsApi.init(clientConfig.keys.access_token);
  api.setDebug(true); // Set to false in production
  return api;
};

/**
 * Post message to Facebook
 * @param {Object} post - Post data
 * @param {String} post.message - Message content
 * @param {String} [post.media] - Media file path
 * @param {String} [reference] - Facebook account reference
 */
const postMessageFacebook = async (post, reference) => {
  try {
    const clientToUse = loadAccountFromReference(reference);
    const api = initializeFacebookApi(clientToUse);
    
    const filePath = post.media ? `${baseImagesURL}/${post.media}` : '';
    const page = new facebookSdk.Page(clientToUse.pageName);

    const fields = ['id', 'message'];
    const params = {
      message: post.message,
      link: filePath
    };

    const result = await page.createFeed(fields, params);
    logger.info(`Posted successfully to ${clientToUse.pageName}, post ID: ${result.id}`);
    
    return result;
  } catch (error) {
    logger.error('Error in postMessageFacebook', error);
    throw error;
  }
};

/**
 * Post photo to Facebook
 * @param {Object} post - Post data
 * @param {String} post.message - Message content
 * @param {String} post.media - Media file path
 * @param {String} [reference] - Facebook account reference
 */
const postPhotoFacebook = async (post, reference) => {
  try {
    const clientToUse = loadAccountFromReference(reference);
    const api = initializeFacebookApi(clientToUse);
    
    const page = new facebookSdk.Page(clientToUse.pageName);
    const photoUrl = `${baseImagesURL}/${post.media}`;

    const fields = ['id', 'message'];
    const params = {
      message: post.message,
      url: photoUrl,
      published: true
    };

    const result = await page.createPhoto(fields, params);
    logger.info(`Posted photo successfully to ${clientToUse.pageName}, photo ID: ${result.id}`);
    
    return result;
  } catch (error) {
    logger.error('Error in postPhotoFacebook', error);
    throw error;
  }
};

module.exports = {
  postMessageFacebook,
  postPhotoFacebook
};
