const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { bskyKeys } = require('../../config/bsky');

const handle = bskyKeys.keys.bsky_handle;
const password = bskyKeys.keys.bsky_password;
let accessToken = null;

// Function to authenticate and get a token
async function authenticate(handle, password) {
  const response = await axios.post('https://bsky.social/xrpc/com.atproto.server.createSession', {
    identifier: handle,
    password: password,
  });

  if (response.data && response.data.accessJwt) {
    accessToken = response.data.accessJwt;
    return response.data.accessJwt;
  } else {
    console.log('Authentication failed:', response.data);
  }
}


async function fetchImage(imageUrl) {
  const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}


async function uploadImage(imageBuffer, imageType, token) {
  const mimeType = `image/${imageType}`;
  const headers = {
    'Content-Type': mimeType,
    'Authorization': `Bearer ${token}`,
  };
  try {
    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.uploadBlob', imageBuffer, {
      headers: headers,
    });
    if (response.data && response.data.blob) {
      return response.data.blob;
    } else {
      console.log('Image upload failed:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


async function createPost(message, blob, token) {
  let repoHandle = "vostpt.bsky.social";
  const postData = {
    repo: repoHandle,
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
            "alt": "test",
          },
        ],
      } : undefined,
    },
  };

  try {
    const response = await axios.post('https://bsky.social/xrpc/com.atproto.repo.createRecord', postData, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    if (response.data) {
      return response.data;
    } else {
      console.log('Post creation failed:', response.data);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}


async function postToBluesky(message, imagePath) {
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
        imageType = path.extname(imagePath).substring(1); // Get the file extension without the dot
      }

      if (imageBuffer && imageType) {
        blob = await uploadImage(imageBuffer, imageType, accessToken);
      }
    }
    const postResponse = await createPost(message, blob, accessToken);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response && error.response.status === 401) {
      // Token has expired, re-authenticate
      console.log('Token expired, re-authenticating...');
      await authenticate(handle, password);
      // Retry the request
      return createPost(message, blob, accessToken);
    }
  }
}


async function sendPostsToBsky(messages) {
  for (const message of messages) {
    await postToBluesky(message.message, message.imageUrl);
  }
}


(async () => {
  await authenticate(handle, password);
})();

module.exports = {
  sendPostsToBsky
};
