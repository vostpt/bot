const axios = require('axios');
const FormData = require('form-data');

const { mastodonKeys } = require('../../config/mastodon');

const defaultClientMasto = mastodonKeys.main;

// const getClient = async reference => {
//   const clientConfig = mastodonKeys[reference] ? mastodonKeys[reference] : defaultClientMasto;
//   return clientConfig;
// };

const uploadMedia = async (fileObject, reference) => {
  const client = mastodonKeys[reference] ? mastodonKeys[reference] : defaultClientMasto;
  const url = `${client.api_url}/v2/media`;
  const nodeBuf = Buffer.from(fileObject.name);
  const formData = new FormData();
  formData.append('file', nodeBuf, 'image.png');
  
  if (fileObject.description) {
    formData.append('description', fileObject.description);
  }

  try {
    const response = await axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${client.access_token}`,
        ...formData.getHeaders(),
      },
      data: formData,
    });
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error('Error response data:', err.response.data);
      console.error('Error response status:', err.response.status);
      console.error('Error response headers:', err.response.headers);
    } else if (err.request) {
      console.error('Error request:', err.request);
    } else {
      console.error('Error message:', err.message);
    }
    console.error('Error config:', err.config);
    return null;
  }
};


const postStatus = async (postObject, reference) => {
  const client = mastodonKeys[reference] ? mastodonKeys[reference] : defaultClientMasto;
  const url = `${client.api_url}/v1/statuses`;
  try {
    return await axios({
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${client.access_token}`,
      },
      data: postObject,
    });
  } catch (err) {
    if (err.response) {
      console.error('Error response data:', err.response.data);
      console.error('Error response status:', err.response.status);
      console.error('Error response headers:', err.response.headers);
    } else if (err.request) {
      console.error('Error request:', err.request);
    } else {
      console.error('Error message:', err.message);
    }
    console.error('Error config:', err.config);
  }
};

module.exports = {
  uploadMedia,
  postStatus,
};
