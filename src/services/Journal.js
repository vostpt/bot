/**
  The Official Journal services
 */

const moment = require('moment');
const { db, Op } = require('../database/models');
const { JournalApi } = require('../api');
const { channels } = require('../../config/bot');
const { journalURLStruct } = require('../../config/journal');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');

const twitterAccounts = {
  'NEGÓCIOS ESTRANGEIROS': '@nestrangeiro_pt',
  'FINANÇAS E TRABALHO, SOLIDARIEDADE E SEGURANÇA SOCIAL': '@trabalho_pt',
  'ECONOMIA E TRANSIÇÃO DIGITAL E PLANEAMENTO': '@economia_pt',
  'INFRAESTRUTURAS E HABITAÇÃO': '@iestruturas_pt',
  'PRESIDÊNCIA DO CONSELHO DE MINISTROS': '@mpresidencia_pt',
  'PRESIDÊNCIA DO CONSELHO DE MINISTROS - SECRETARIA-GERAL': '@mpresidencia_pt',
  'AMBIENTE E AÇÃO CLIMÁTICA': '@ambiente_pt',
  CULTURA: '@cultura_pt',
  AGRICULTURA: '@agricultura_pt',
  MAR: '@mar_pt',
  FINANÇAS: '@pt_financas',
  SAÚDE: '@saude_pt',
  'DEFESA NACIONAL': '@defesa_pt',
  'ADMINISTRAÇÃO INTERNA': '@ainterna_pt',
  JUSTIÇA: '@justica_pt',
  EDUCAÇÃO: '@Educacao_PT',
  'MODERNIZAÇÃO DO ESTADO E DA ADMINISTRAÇÃO PÚBLICA': '@modernizacao_pt',
};

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
      const decreePdfURL = decree.link;

      const decreeNum = /\d+/.exec(decreePdfURL);

      const decreeURL = decreeNum.length === 1
        ? `${journalURLStruct.prefix}${decreeNum[0]}${journalURLStruct.suffix}`
        : 'N/A';

      const splitDescription = decree.contentSnippet.split('\n');

      const issuer = splitDescription.shift();

      const description = splitDescription.join('\n');

      const strIssuer = `Emitido por: ${issuer}`;

      const strDiscord = `***Nova entrada:***\n${decree.title}\n*${strIssuer}*\`\`\`${description}\`\`\`\n:link: <${decreeURL}>\n:file_folder: <${decree.link}>`;

      sendMessageToChannel(channel, strDiscord);

      const issuerUpper = issuer.toUpperCase();

      const issuerHandle = twitterAccounts[issuerUpper]
        ? twitterAccounts[issuerUpper]
        : issuer;

      const tweetLength = decree.title.length + issuerHandle.length + decreeURL.length + 15;

      const descLength = description.length;

      const strDescription = tweetLength + descLength < 280
        ? description
        : `${description.substring(0, 274 - tweetLength)} (...)`;

      const tweet = [{
        status: `${decree.title}\n\nEmissor: ${issuerHandle}\n\n${strDescription}\n\n${decreeURL}`,
      }];

      uploadThreadTwitter(tweet, '', 'dre');

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
