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

async function isTokenValid() {
  if (!accessToken) {
    console.log('[BSKY-AUTH] No access token present');
    return false;
  }

  try {
    const response = await axios.get('https://bsky.social/xrpc/com.atproto.server.getSession', {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (response.data && response.data.handle) {
      console.log('[BSKY-AUTH] Token validated successfully for handle:', response.data.handle);
      return true;
    }

    console.log('[BSKY-AUTH] Token validation failed: Invalid response format');
    return false;

  } catch (error) {
    if (error.response?.status === 401) {
      console.log('[BSKY-AUTH] Token is invalid or expired');
    } else {
      console.error('[BSKY-AUTH] Error checking token validity:', {
        error: error.message,
        status: error.response?.status,
        timestamp: new Date().toISOString()
      });
    }
    return false;
  }
}


async function fetchImage(imageUrl) {
  try {
    console.log('[BSKY-IMAGE] Fetching image from:', imageUrl);
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

async function createPost(message, blob, token, imageDes) {
  const postData = {
    repo: repohandle,
    collection: 'app.bsky.feed.post',
    validate: true,
    record: {
      text: message,
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
    } else if (response.data && response.data.error == "ExpiredToken") {
      await authenticate(handle, password);
      return await createPost(message, blob, accessToken);
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

    if (error.response?.status === 401) {
      console.log('[BSKY-AUTH] Token expired, attempting re-authentication...');
      try {
        await authenticate(handle, password);
        console.log('[BSKY-AUTH] Re-authentication successful, retrying post...');
        return await createPost(message, blob, accessToken);
      } catch (reAuthError) {
        console.error('[BSKY-AUTH-ERROR] Re-authentication failed:', {
          error: reAuthError.message,
          timestamp: new Date().toISOString()
        });
        throw reAuthError;
      }
    }
    throw error;
  }
}

async function sendPostsToBsky(messages) {
  console.log('[BSKY-BATCH] Starting batch post processing:', {
    messageCount: messages.length,
    timestamp: new Date().toISOString()
  });

  isTokenValid();

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

