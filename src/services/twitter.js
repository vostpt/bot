const { TWITTER } = require('../config/services');
const { TwitterApi } = require('twitter-api-v2');
const { getFileContent } = require('../helpers');
const { twitterKeys } = require('../../config/twitter');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./siscord');

// Constants
const LOG_PREFIX = '[Twitter]';
const MEDIA_TYPE = 'image/png';

/**
 * Custom logger for Twitter service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Initialize Twitter clients from configuration
 */
const initializeTwitterClients = () => {
  try {
    if (!TWITTER || !TWITTER.enabled) {
      logger.warning('Twitter service is disabled in configuration');
      return null;
    }
    const clients = twitterKeys.map((account) => ({
      reference: account.reference,
      screenName: account.screenName,
      fetchTweets: account.fetchTweets,
      client: new TwitterApi({
        appKey: account.keys.consumer_key,
        appSecret: account.keys.consumer_secret,
        accessToken: account.keys.access_token,
        accessSecret: account.keys.access_token_secret,
      }),
    }));

    logger.info(`Initialized ${clients.length} Twitter clients`);
    return clients;
  } catch (error) {
    logger.error('Failed to initialize Twitter clients', error);
    throw error;
  }
};

const twitterClients = initializeTwitterClients();
const defaultClientTwitter = twitterClients.find((element) => element.reference === 'main');

/**
 * Pre-defined tweets for VOST Europe
 */
const vostEuTweets = {
  1: [{
    status: `☁️🌂🌀❄️🌊
⚠ Weather warnings\n⚠ Avisos meteorológicos\n⚠ Alertes météo\n⚠ Wetterwarnungen\n⚠ Allerte meteo
#SevereWeather\n\n#SMEM #MSGU #RSGE\n\nhttps://meteoalarm.org`,
    media: ['vost_eu/daily_tweets/DAILY_TWEETS_METEOALARM.png'],
  }],
  2: [{
    status: `📌 ECHO Daily Flash of the European Emergency Response Coordination Centre 📢 #ERCC 
@eu_echo\n\n#EUCivPro #RescEU\n#SMEM #MSGU #RSGE\nhttp://erccportal.jrc.ec.europa.eu/ECHO-Flash`,
    media: ['vost_eu/daily_tweets/DAILY_TWEETS_ECHOFLASH.png'],
  }],
};

/**
 * Upload media files to Twitter
 * @param {TwitterApi} client - Twitter client instance
 * @param {Array<String>} mediaFiles - Array of media file paths
 * @returns {Promise<Array<String>>} Array of uploaded media IDs
 */
const uploadMediaFiles = async (client, mediaFiles) => {
  if (!mediaFiles || mediaFiles.length === 0) {
    return [];
  }

  try {
    const uploadedMedia = await Promise.all(
      mediaFiles.map(async (filedata) => {
        const fileContent = getFileContent(filedata);
        return await client.v1.uploadMedia(fileContent, { mimeType: MEDIA_TYPE });
      })
    );
    logger.info(`Uploaded ${uploadedMedia.length} media files`);
    return uploadedMedia;
  } catch (error) {
    logger.error('Failed to upload media files', error);
    throw error;
  }
};

/**
 * Send a single tweet with optional media
 * @param {TwitterApi} client - Twitter client instance
 * @param {Object} tweetData - Tweet content and media
 * @returns {Promise<Object>} Tweet response
 */
const sendTweet = async (client, tweetData) => {
  try {
    const uploadedMedia = await uploadMediaFiles(client, tweetData.media);
    
    const params = {
      text: tweetData.status,
      media: uploadedMedia.length > 0 ? { media_ids: uploadedMedia } : undefined,
    };

    const response = await client.v2.tweet(params);
    if (response.data.errors) {
      logger.error('Tweet errors:', response.data.errors);
      throw new Error('Failed to send tweet');
    }

    logger.info('Tweet sent successfully');
    return response;
  } catch (error) {
    logger.error('Failed to send tweet', error);
    throw error;
  }
};

/**
 * Send a thread of tweets
 * @param {Array<Object>} tweetSeq - Array of tweet data
 * @param {String} tweetId - ID of parent tweet (optional)
 * @param {String} reference - Twitter client reference
 */
const uploadThreadTwitter = async (tweetSeq, tweetId = '', reference) => {
  if (tweetSeq.length === 0) {
    return;
  }

  try {
    const accountPos = twitterClients.findIndex((element) => element.reference === reference);
    const clientTwitter = accountPos < 0 ? twitterClients[0].client : twitterClients[accountPos].client;

    logger.info(`Starting tweet thread with ${tweetSeq.length} tweets`);

    for (const tweet of tweetSeq) {
      await sendTweet(clientTwitter, tweet);
    }

    logger.info('Tweet thread completed successfully');
  } catch (error) {
    logger.error('Failed to upload tweet thread', error);
    throw error;
  }
};

/**
 * Send VOST Europe scheduled tweets
 * @param {Number} tweetId - ID of the pre-defined tweet
 */
const tweetVostEu = async (tweetId) => {
  try {
    const thread = vostEuTweets[tweetId];
    if (!thread) {
      logger.warning(`No pre-defined tweet found for ID: ${tweetId}`);
      return;
    }

    logger.info(`Sending VOST Europe tweet ${tweetId}`);
    // Uncomment when ready to send tweets
    // await uploadThreadTwitter(thread, null, 'europe');
  } catch (error) {
    logger.error(`Failed to send VOST Europe tweet ${tweetId}`, error);
  }
};

/*
 * Note: The following features are currently unavailable in v2 free tier:
 * - getVostTweetsAndSendToDiscord
 * - sendNewTweets
 * These features have been removed from the exports but can be reimplemented
 * when using a paid tier or when the API supports these features.
 */

module.exports = {
  clientTwitter: defaultClientTwitter.client,
  uploadThreadTwitter,
  tweetVostEu,
  // Export additional utilities if needed by other services
  uploadMediaFiles,
  sendTweet,
};
