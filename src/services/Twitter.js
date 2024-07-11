const { TwitterApi } = require('twitter-api-v2');
const { getFileContent } = require('../helpers');
const { twitterKeys } = require('../../config/twitter');
const { channels } = require('../../config/bot');
const { db } = require('../database/models');
const { sendMessageToChannel } = require('./Discord');

const twitterClients = twitterKeys.map((account) => ({
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

const defaultClientTwitter = twitterClients.find((element) => element.reference === 'main');

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
* Recursive function
* Send a thread to Twitter
* Each tweet can have text and photos or only text
*
* @async
* @param {Array<Object>} tweetSeq
* @param {String} tweetId
* @param {String} reference
*/
const uploadThreadTwitter = async (tweetSeq, tweetId = '', reference) => {
  if (tweetSeq.length === 0) {
    return;
  }

  const accountPos = twitterClients.findIndex((element) => element.reference === reference);

  const clientTwitter = accountPos < 0
    ? twitterClients[0].client
    : twitterClients[accountPos].client;

  for(let i = 0; i < tweetSeq.length; i++){
    const tweetToSend = tweetSeq[i];
    const uploadedMedia = tweetToSend.media && tweetToSend.media.length > 0
    ? await Promise.all(tweetToSend.media.map(async (filedata) => {
        const fileContent = getFileContent(filedata);
        const mediaType = "image/png";
        const media = await clientTwitter.v1.uploadMedia(fileContent, { mimeType: mediaType });
        return media;
      }))
    : [];

    const params = {
      text: tweetToSend.status,
      media: uploadedMedia.length > 0 ? { media_ids: uploadedMedia } : undefined,
    };

    const response = await clientTwitter.v2.tweet(params);
    if(response.data.errors){
      console.log(response.data.errors);
    }
  }
};


/******************* Unavailable in v2 free tier ****************** 
// /**
// * Send new tweets, and update DB with last tweet ID
// *
// * @async
// * @param {Object} client
// * @param {String} reference
// * @param {Object} data
// */
//
// const sendNewTweets = async (client, data, reference, screenName, lastTweetId) => {
//   const filteredData = lastTweetId
//     ? data.filter((tweet) => tweet.id_str !== lastTweetId).reverse()
//     : data.reverse();
//
//   const filteredDataLength = filteredData.length;
//
//   if (filteredDataLength > 0) {
//     const tweetIds = filteredData.map((tweet) => tweet.id_str);
//
//     const strArray = filteredData.map((tweet) => tweet.text);
//
//     const introStr = `***Novo(s) tweets da conta @${screenName}:***\n`;
//
//     sendMessageToChannel(client.channels.get(channels.TWFEED_CHANNEL_ID), introStr);
//
//     strArray.forEach((tweetText) => {
//       const string = `>>> ${tweetText}`;
//       sendMessageToChannel(client.channels.get(channels.TWFEED_CHANNEL_ID), string);
//     });
//
//     if (reference) {
//       db.Tweets.upsert({
//         reference,
//         lastTweetId: tweetIds[filteredDataLength - 1],
//       });
//     }
//   }
// };
//
// /**
// * Fetch new tweets made by VOST accounts
// *
// * @async
// * @param {Object} discordClient
// */
// const getVostTweetsAndSendToDiscord = async (discordClient) => {
//   const enabledClients = twitterClients.filter((client) => client.fetchTweets);
//
//   for (let i = 0; i < enabledClients.length; i += 1) {
//     const {
//       reference,
//       screenName,
//       client,
//     } = enabledClients[i];
//
//     const result = await db.Tweets.findAll({
//       where: {
//         reference,
//       },
//     });
//
//     const params = {
//       screen_name: screenName,
//       trim_user: true,
//       count: 20,
//       exclude_replies: true,
//       include_rts: true,
//     };
//
//     params.since_id = result.length > 0 && result[0].dataValues.lastTweetId !== 'null'
//       ? result[0].dataValues.lastTweetId
//       : undefined;
//
//     client.get('statuses/user_timeline', params, (err, data, response) => {
//       if (!err && response !== '') {
//         sendNewTweets(discordClient, data, reference, screenName, params.since_id);
//       }
//     });
//   }
// };

const tweetVostEu = async (tweetId) => {
  const thread = vostEuTweets[tweetId];

  // uploadThreadTwitter(thread, null, 'europe');
};

module.exports = {
  clientTwitter: defaultClientTwitter.client,
  uploadThreadTwitter,
  // getVostTweetsAndSendToDiscord,
  tweetVostEu,
};

