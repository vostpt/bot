const FB = require('fb');
const {
    facebookKeys,
    defaultReference
} = require('../../config/facebook');
const { channels } = require('../../config/bot');
const { db } = require('../database/models');
const { getChannel, sendMessageToChannel } = require('./Discord');
const { baseImagesURL } = require('../../config/api');
const { isDryRun, recordPublication } = require('../helpers/publicationLog');

const serviceName = 'FacebookService';

const getPostId = (post) => post.id.split("_")[1];

/**
 * Loads an API client from the ACCESS_TOKEN of the {@paramref reference} 
 * and posts the {@paramref message} to FB
 * @param {String} post {message: to post to Facebook, media: image to display}
 * @param {String} reference which Facebook client to use (defaults to `main`)
 */
const postMessageFacebook = (post, reference) => {
    if (isDryRun()) {
        return Promise.resolve(recordPublication('facebook', {
            account: reference || defaultReference,
            message: post.message,
            media: post.media,
        }));
    }

    const filePath = post.media !== undefined
        ? `${baseImagesURL}/${post.media}`
        : '';
    const clientToUse = loadAccountFromReference(reference);
    const fb = FB.withAccessToken(clientToUse.keys.access_token);

    return new Promise((resolve, reject) => fb.api(
        `/${clientToUse.pageName}/feed`,
        'POST', {
        "message": post.message,
        'link': filePath
    },
        (res) => {
            if (res.error) {
                console.error(`[${serviceName}] error when sending the following message:\n\n '${post.message}', reason:\n\n`, res.error);
                reject(res.error);
                return;
            }
            resolve(res);
        }
    ));
}

/**
 * Calls FB API for each of the clients and posts new messages into Discord
 * @param {Object} discordClient 
 */
const getVostPostsAndSendToDiscord = async (discordClient) => {
    const enabledClients = facebookKeys.filter(client => client.fetchPosts);

    return Promise.all(enabledClients.map(async client => {
        const fb = FB.withAccessToken(client.keys.access_token);
        const result = await db.FbPosts.findOne({
            where: {
                reference: client.reference
            },
        });
        const latestSentPostId = result?.lastPostId ?? 0;

        return new Promise((resolve, reject) => fb.api(
            `/${client.pageName}/feed`,
            'GET', {},
            (res) => {
                if (res.error) {
                    console.error(`[${serviceName}] error when getting posts for ${client.pageName}, reason:\n\n`, res.error);
                    reject(res.error);
                    return;
                }

                Promise.resolve()
                    .then(async () => {
                        if (!res?.data?.length) return;

                        const newPosts = res.data.filter(post => post.id.split("_")[1] > latestSentPostId);

                        await sendPostsToDiscord(discordClient, newPosts, client);

                        if (newPosts.length > 0) {
                            const postIds = newPosts.map(post => getPostId(post));
                            const lastPostId = Math.max(...postIds);

                            await db.FbPosts.upsert({
                                reference: client.reference,
                                lastPostId
                            });
                        }
                    })
                    .then(resolve, reject);
            }
        ));
    }));
}

/**
 * Filters irrelevant posts and then sends them from oldest to most recent into the FBFEED_CHANNEL_ID
 * @param {Object} discordClient 
 * @param {Array<String>} newPosts 
 */
const sendPostsToDiscord = async (discordClient, newPosts, client) => {
    newPosts = newPosts.filter(post => (!/^.+was live\.$/.test(post.story)) && (post.message?.length || post.story?.length));
    if (!newPosts.length) return;
    const plural = newPosts.length > 1 ? 's' : '';
    const introStr = `***${newPosts.length} novo${plural} post${plural} da conta @${client.pageName}:***\n`;

    const channel = await getChannel(discordClient, channels.FBFEED_CHANNEL_ID);
    if (!channel) throw new Error('Discord Facebook feed channel is not configured or accessible');

    await sendMessageToChannel(channel, introStr);
    for (const post of newPosts.reverse()) {
        const message = `>>> ${post.message ?? ''} ${post?.story ?? ''}\n<https://www.facebook.com/${client.pageName}/posts/${getPostId(post)}>`;
        await sendMessageToChannel(channel, message);
    }
}

/**
 * Load FB client from reference name as defined in configs
 * @param {String} reference which Facebook client to use (defaults to `main`)
 * @returns a FB client which can be used to interact with the API
 */
function loadAccountFromReference(reference) {
    reference = reference || defaultReference;
    const clientToUse = facebookKeys.find(account => account.reference === reference);
    return clientToUse;
}



module.exports = {
    postMessageFacebook,
    getVostPostsAndSendToDiscord
}
