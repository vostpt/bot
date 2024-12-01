const { BSKY } = require('../config/services');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { bskyKeys } = require('../../config/bsky');
const sharp = require('sharp');

// Constants
const LOG_PREFIX = '[Bluesky]';
const API_BASE_URL = 'https://bsky.social/xrpc';
const MAX_IMAGE_SIZE_KB = 900;
const MAX_IMAGE_DIMENSION = 1200;
const IMAGE_QUALITY = 85;

// Configuration
const config = {
  handle: bskyKeys.keys.bsky_handle,
  password: bskyKeys.keys.bsky_password,
  repoHandle: bskyKeys.keys.bsky_repohandle,
  accessToken: null
};

/**
 * Custom logger
 */
const logger = {
  info: (message, data = {}) => console.log(`${LOG_PREFIX} ${message}`, data),
  error: (message, error = {}) => console.error(`${LOG_PREFIX} ERROR: ${message}`, {
    ...error,
    timestamp: new Date().toISOString()
  })
};

/**
 * API client with common configurations
 */
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

/**
 * Authenticate and get access token
 */
const authenticate = async () => {
  try {
    const response = await apiClient.post('/com.atproto.server.createSession', {
      identifier: config.handle,
      password: config.password
    });

    if (response.data?.accessJwt) {
      config.accessToken = response.data.accessJwt;
      logger.info('Authenticated successfully', { handle: config.handle });
      return response.data.accessJwt;
    }

    throw new Error('No access token in response');
  } catch (error) {
    logger.error('Authentication failed', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Fetch image from URL
 */
const fetchImage = async (imageUrl) => {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    logger.info('Fetched image', { url: imageUrl });
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    logger.error('Failed to fetch image', {
      url: imageUrl,
      message: error.message
    });
    throw error;
  }
};

/**
 * Process image to meet size requirements
 */
const processImage = async (imageBuffer) => {
  const sizeInKb = imageBuffer.length / 1024;
  logger.info('Processing image', { originalSize: `${sizeInKb.toFixed(2)}KB` });

  if (sizeInKb <= MAX_IMAGE_SIZE_KB) {
    return imageBuffer;
  }

  try {
    const processedBuffer = await sharp(imageBuffer)
      .resize(MAX_IMAGE_DIMENSION, MAX_IMAGE_DIMENSION, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .png({ quality: IMAGE_QUALITY })
      .toBuffer();

    const newSizeKb = processedBuffer.length / 1024;
    logger.info('Image resized', {
      newSize: `${newSizeKb.toFixed(2)}KB`,
      reduction: `${((sizeInKb - newSizeKb) / sizeInKb * 100).toFixed(2)}%`
    });

    return processedBuffer;
  } catch (error) {
    logger.error('Failed to process image', { message: error.message });
    throw error;
  }
};

/**
 * Upload image to Bluesky
 */
const uploadImage = async (imageBuffer, imageType) => {
  try {
    const processedBuffer = await processImage(imageBuffer);
    const response = await apiClient.post('/com.atproto.repo.uploadBlob', 
      processedBuffer,
      {
        headers: {
          'Content-Type': `image/${imageType}`,
          'Authorization': `Bearer ${config.accessToken}`
        }
      }
    );

    if (response.data?.blob) {
      logger.info('Image uploaded successfully');
      return response.data.blob;
    }

    if (response.data?.error === 'ExpiredToken') {
      await authenticate();
      return uploadImage(imageBuffer, imageType);
    }

    throw new Error('Upload failed - no blob in response');
  } catch (error) {
    logger.error('Failed to upload image', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Create a post with optional image
 */
const createPost = async (message, blob, imageDes) => {
  const postData = {
    repo: config.repoHandle,
    collection: 'app.bsky.feed.post',
    validate: true,
    record: {
      text: message,
      createdAt: new Date().toISOString(),
      embed: blob ? {
        "$type": "app.bsky.embed.images",
        "images": [{
          "image": blob,
          "alt": imageDes
        }]
      } : undefined
    }
  };

  try {
    const response = await apiClient.post('/com.atproto.repo.createRecord', 
      postData,
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`
        }
      }
    );

    if (response.data && response.status === 200) {
      logger.info('Post created successfully', {
        uri: response.data.uri,
        cid: response.data.cid
      });
      return response.data;
    }

    throw new Error('Post creation failed');
  } catch (error) {
    logger.error('Failed to create post', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

/**
 * Post a single message to Bluesky
 */
const postToBluesky = async (message, imagePath, imageDes) => {
  try {
    if (!config.accessToken) {
      await authenticate();
    }

    let blob;
    if (imagePath) {
      let imageBuffer;
      let imageType;

      if (imagePath.startsWith('http')) {
        imageBuffer = await fetchImage(imagePath);
        imageType = path.extname(new URL(imagePath).pathname).substring(1);
      } else if (fs.existsSync(imagePath)) {
        imageBuffer = fs.readFileSync(imagePath);
        imageType = path.extname(imagePath).substring(1);
      }

      if (imageBuffer && imageType) {
        blob = await uploadImage(imageBuffer, imageType);
      }
    }

    return await createPost(message, blob, imageDes);
  } catch (error) {
    logger.error('Post process failed', {
      message: error.message,
      imagePath
    });
    throw error;
  }
};

/**
 * Send multiple posts to Bluesky
 */
const sendPostsToBsky = async (messages) => {
  if (!BSKY || !BSKY.enabled) {
    logger.warning('Bluesky service is disabled');
    return;
  }

  logger.info('Starting batch processing', { count: messages.length });

  try {
    await authenticate();

    for (const message of messages) {
      try {
        await postToBluesky(message.message, message.imageUrl, message.imageDes);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limiting
      } catch (error) {
        logger.error('Failed to process message in batch', {
          message: message.message,
          error: error.message
        });
        continue; // Continue with next message
      }
    }

    logger.info('Batch processing completed');
  } catch (error) {
    logger.error('Batch process failed', { message: error.message });
    throw error;
  }
};

// Initial authentication
(async () => {
  try {
    await authenticate();
  } catch (error) {
    logger.error('Initial authentication failed', { message: error.message });
  }
})();

module.exports = {
  sendPostsToBsky
};
