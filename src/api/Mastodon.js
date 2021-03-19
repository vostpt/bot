const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');

const { mastodonKeys } = require('../../config/mastodon');

const defaultClientMasto = mastodonKeys.main;

const getClient = async reference => (mastodonKeys[reference]
  ? mastodonKeys[reference]
  : defaultClientMasto);

const uploadMedia = async (fileObject, reference) => {
  const client = await getClient(reference);

  const url = `${client.api_url}/media`;

  const formData = new FormData();
  formData.append('file', fs.createReadStream(fileObject.path));

  const res = await axios({
    method: 'post',
    url,
    headers: {
      Authorization: `Bearer ${client.access_token}`,
      ...formData.getHeaders(),
    },
    data: formData,
  })
    // eslint-disable-next-line no-console
    .catch(err => console.log(err));

  return res.data;
};

const postStatus = async (postObject, reference) => {
  const client = await getClient(reference);

  const url = `${client.api_url}/statuses`;

  await axios({
    method: 'post',
    url,
    headers: {
      Authorization: `Bearer ${client.access_token}`,
    },
    data: postObject,
  })
    // eslint-disable-next-line no-console
    .catch(err => console.log(err));
};

module.exports = {
  uploadMedia,
  postStatus,
};
