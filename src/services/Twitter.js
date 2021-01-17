const Twit = require('twit');
const { getFileContent } = require('../helpers');
const { twitterKeys } = require('../../config/twitter');
const { channels } = require('../../config/bot');
const { db } = require('../database/models');
const { sendMessageToChannel } = require('./Discord');

const twitterClients = twitterKeys.map(account => ({
  reference: account.reference,
  screenName: account.screenName,
  client: new Twit(account.keys),
}));

const defaultClientTwitter = twitterClients.find(element => element.reference === 'main');

/**
* Recursive function
* Send a thread to Twitter
* Each tweet can have text and photos or only text
*
* @async
* @param {Array<Object>} tweetSeq
* @param {String} tweetId
* @param {String} reference
*/
const uploadThreadTwitter = (tweetSeq, tweetId = '', reference) => {
  if (tweetSeq.length === 0) {
    return;
  }

  const accountPos = twitterClients.findIndex(element => element.reference === reference);

  const clientTwitter = accountPos < 0
    ? defaultClientTwitter.client
    : twitterClients[accountPos].client;

  const tweetToSend = tweetSeq.shift();

  const uploadedMedia = tweetToSend.media !== undefined
    ? tweetToSend.media.map((filedata) => {
      const fileContent = getFileContent(filedata);

      return clientTwitter.post('media/upload', { media_data: fileContent });
    })
    : [];

  Promise.all(uploadedMedia).then((results) => {
    const mediaIds = results.map(({ data }) => {
      const { media_id_string: mediaId } = data;

      clientTwitter.post('media/metadata/create', { media_id: mediaId });

      return mediaId;
    });

    const params = {
      status: tweetToSend.status,
      media_ids: mediaIds,
      in_reply_to_status_id: tweetId,
    };

    clientTwitter.post('statuses/update', params, (err, data, response) => {
      if (!err && response !== '') {
        uploadThreadTwitter(tweetSeq, data.id_str, reference);
      }
    });
  });
};

/**
* Send new tweets, and update DB with last tweet ID
*
* @async
* @param {Object} client
* @param {String} reference
* @param {Object} data
*/

const sendNewTweets = async (client, data, reference, screenName, lastTweetId) => {
  const filteredData = lastTweetId
    ? data.filter(tweet => tweet.id !== lastTweetId).reverse()
    : data.reverse();

  const filteredDataLength = filteredData.length;

  if (filteredDataLength > 0) {
    const tweetIds = filteredData.map(tweet => tweet.id);

    const strArray = filteredData.map(tweet => tweet.text);

    const introStr = `***Novo(s) tweets da conta @${screenName}:***\n`;

    sendMessageToChannel(client.channels.get(channels.TWFEED_CHANNEL_ID), introStr);

    strArray.forEach((tweetText) => {
      const string = `>>> ${tweetText}`;
      sendMessageToChannel(client.channels.get(channels.TWFEED_CHANNEL_ID), string);
    });

    if (reference) {
      db.Tweets.upsert({
        reference,
        lastTweetId: tweetIds[filteredDataLength - 1],
      });
    }
  }
};

/**
* Fetch new tweets made by VOST accounts
*
* @async
* @param {Object} discordClient
*/

const getVostTweets = async (discordClient) => {
  for (let i = 0; i < twitterClients.length; i += 1) {
    const {
      reference,
      screenName,
      client,
    } = twitterClients[i];

    // eslint-disable-next-line no-await-in-loop
    const result = await db.Tweets.findAll({
      where: {
        reference,
      },
    });

    const params = {
      screen_name: screenName,
      trim_user: true,
      count: 20,
      exclude_replies: true,
      include_rts: true,
    };

    params.since_id = result.length > 0 && result[0].dataValues.lastTweetId !== 'null'
      ? result[0].dataValues.lastTweetId
      : undefined;

    client.get('statuses/user_timeline', params, (err, data, response) => {
      if (!err && response !== '') {
        sendNewTweets(discordClient, data, reference, screenName, params.since_id);
      }
    });
  }
};

module.exports = {
  clientTwitter: defaultClientTwitter.client,
  uploadThreadTwitter,
  getVostTweets,
};
