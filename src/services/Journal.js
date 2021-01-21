/**
  The Official Journal services
 */

const moment = require('moment');
const { db, Op } = require('../database/models');
const { JournalApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');

/**
 * Check if the decree link/URL is not in database
 *
 * @param {Object} decree
 */
const decreeNotInDb = decree => db.Decrees.findOne({
  where: {
    link: decree.link,
  },
})
  .then(result => result === null);

/**
 * Check new decrees. If exists, send to Discord
 *
 * @async
 * @param {Object} client
 */
const checkNewDecrees = async (client) => {
  const decrees = await JournalApi.getJournal();

  const channel = client.channels.get(channels.JOURNAL_CHANNEL_ID);

  decrees.forEach(async (decree) => {
    const notInDb = await decreeNotInDb(decree);

    if (notInDb) {
      const strDiscord = `***Novo decreto:***\n${decree.title}\n\`\`\`${decree.contentSnippet}\`\`\`<${decree.link}>`;

      sendMessageToChannel(channel, strDiscord);

      db.Decrees.create({
        link: decree.link,
        title: decree.title,
        description: decree.contentSnippet,
      });
    }
  });
};

const clearDb = async () => {
  const dateLimit = moment().subtract('2', 'days').format('YYYY-MM-DD');

  db.Decrees.destroy({
    where: {
      updatedAt: {
        [Op.lte]: dateLimit,
      },
    },
  });
};

module.exports = {
  checkNewDecrees,
  clearDb,
};
