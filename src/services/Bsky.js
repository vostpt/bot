const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { bskyKeys } = require('../../config/bsky');
const sharp = require('sharp');

const handle = bskyKeys.keys.bsky_handle;
const password = bskyKeys.keys.bsky_password;
const repohandle = bskyKeys.keys.bsky_repohandle;
let accessToken = null;

// Function to authenticate and get a token
async function authenticate(handle, password) {
  try {
    const response = await axios.post('https://bsky.social/xrpc/com.atproto.server.createSession', {
      identifier: handle,
      password: password,
    });

    if (response.data && response.data.accessJwt) {
      accessToken = response.data.accessJwt;
      console.log('[BSKY-AUTH] Successfully authenticated for handle:', handle);
      return response.data.accessJwt;
    } else {
      console.error('[BSKY-AUTH-ERROR] Authentication failed:', JSON.stringify({
        response: response.data,
        handle: handle,
        timestamp: new Date().toISOString()
      }));
    }
  } catch (error) {
    console.error('[BSKY-AUTH-ERROR] Authentication error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function fetchImage(imageUrl) {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    console.log('[BSKY-IMAGE] Successfully fetched image:', imageUrl);
    return Buffer.from(response.data, 'binary');
  } catch (error) {
    console.error('[BSKY-IMAGE-ERROR] Failed to fetch image:', {
      url: imageUrl,
      error: error.message,
      status: error.response?.status,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function uploadImage(imageBuffer, imageType, token) {
  const mimeType = `image/${imageType}`;
  const headers = {
    'Content-Type': mimeType,
    'Authorization': `Bearer ${token}`,
  };

  try {
    const sizeInBytes = imageBuffer.length;
    const sizeInKb = sizeInBytes / 1024;
    console.log('[BSKY-UPLOAD] Processing image:', {
      originalSize: `${sizeInKb.toFixed(2)}KB`,
      type: imageType
    });

    let processedBuffer = imageBuffer;
    if (sizeInKb > 900) {
      console.log('[BSKY-UPLOAD] Image exceeds 900KB, resizing...');
      processedBuffer = await sharp(imageBuffer)
        .resize(1200, 1200, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .png({ quality: 85 })
        .toBuffer();

      const newSizeKb = processedBuffer.length / 1024;
      console.log('[BSKY-UPLOAD] Image resized:', {
        newSize: `${newSizeKb.toFixed(2)}KB`,
        reduction: `${((sizeInKb - newSizeKb) / sizeInKb * 100).toFixed(2)}%`
      });
    }

    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', processedBuffer, {
      headers: headers,
    });

    if (response.data && response.data.blob) {
      console.log('[BSKY-UPLOAD] Successfully uploaded image');
      return response.data.blob;
    } else if (response.data && response.data.error == "ExpiredToken") {
      await authenticate(handle, password);
      return await uploadImage(imageBuffer, imageType, accessToken);
    } else {
      console.error('[BSKY-UPLOAD-ERROR] Image upload failed:', {
        response: response.data,
        timestamp: new Date().toISOString()
      });
      throw new Error('Image upload failed - no blob in response');
    }
  } catch (error) {
    console.error('[BSKY-UPLOAD-ERROR] Failed to upload image:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

const processInlineHashtags = (text) => {
  try {
    const hashtagRegex = /#[\p{L}\p{N}_]+/gu;
    const hashtags = text.match(hashtagRegex) || [];

    const facets = [];

    hashtags.forEach(hashTag => {
      const tagPosition = text.indexOf(hashTag);

      if (tagPosition !== -1) {
        const beforeTag = text.slice(0, tagPosition);
        const beforeTagBytes = new TextEncoder().encode(beforeTag);
        const tagBytes = new TextEncoder().encode(hashTag);

        facets.push({
          index: {
            byteStart: beforeTagBytes.length,
            byteEnd: beforeTagBytes.length + tagBytes.length
          },
          features: [{
            $type: 'app.bsky.richtext.facet#tag',
            tag: hashTag.slice(1) // Remove the # symbol
          }]
        });
      }
    });

    console.log('[BSKY-HASHTAGS] Processed inline hashtags:', {
      hashtagCount: hashtags.length,
      facetsCreated: facets.length,
      hashtags: hashtags
    });

    return { text, facets };
  } catch (error) {
    console.error('[BSKY-HASHTAGS-ERROR] Failed to process inline hashtags:', {
      error: error.message,
      text: text,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
};


async function createPost(message, blob, token, imageDes) {
  const processedPost = processInlineHashtags(message);

  const postData = {
    repo: repohandle,
    collection: 'app.bsky.feed.post',
    validate: true,
    record: {
      text: processedPost.text,
      facets: processedPost.facets,
      createdAt: new Date().toISOString(),
      embed: blob ? {
        "$type": "app.bsky.embed.images",
        "images": [
          {
            "image": blob,
            "alt": imageDes,
          },
        ],
      } : undefined,
    },
  };

  try {
    console.log('[BSKY-POST] Attempting to create post:', {
      messageLength: message.length,
      hasImage: !!blob,
      timestamp: new Date().toISOString()
    });

    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.createRecord', postData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.data && response.status == 200) {
      console.log('[BSKY-POST] Successfully created post:', {
        uri: response.data.uri,
        cid: response.data.cid,
        timestamp: new Date().toISOString()
      });
      return response.data;
    } else {
      console.error('[BSKY-POST-ERROR] Post creation failed:', {
        response: response.data,
        postData: JSON.stringify(postData),
        timestamp: new Date().toISOString()
      });
      throw new Error('Post creation failed - no response data');
    }
  } catch (error) {
    console.error('[BSKY-POST-ERROR] Failed to create post:', {
      error: error.message,
      status: error.response?.status,
      data: error.response?.data,
      postData: JSON.stringify(postData),
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function postToBluesky(message, imagePath, imageDes) {
  try {
    if (!accessToken) {
      await authenticate(handle, password);
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
        blob = await uploadImage(imageBuffer, imageType, accessToken);
      }
    }

    const postResponse = await createPost(message, blob, accessToken, imageDes);
    return postResponse;
  } catch (error) {
    console.error('[BSKY-ERROR] Main posting process failed:', {
      error: error.message,
      message: message,
      imagePath: imagePath,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

async function sendPostsToBsky(messages) {
  console.log('[BSKY-BATCH] Starting batch post processing:', {
    messageCount: messages.length,
    timestamp: new Date().toISOString()
  });

  await authenticate(handle, password);

  for (const message of messages) {
    try {
      await postToBluesky(message.message, message.imageUrl, message.imageDes);
    } catch (error) {
      console.error('[BSKY-BATCH-ERROR] Failed to process message in batch:', {
        message: message.message,
        imageUrl: message.imageUrl,
        error: error.message,
        timestamp: new Date().toISOString()
      });
      // Continue with next message even if one fails
      continue;
    }
  }
  console.log('[BSKY-BATCH] Completed batch post processing');
}

(async () => {
  try {
    await authenticate(handle, password);
  } catch (error) {
    console.error('[BSKY-INIT-ERROR] Initial authentication failed:', {
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
})();

module.exports = {
  sendPostsToBsky
};
