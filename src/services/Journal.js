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
  'TRABALHO, SOLIDARIEDADE E SEGURANÇA SOCIAL': '@trabalho_pt',
  'ECONOMIA E TRANSIÇÃO DIGITAL': '@economia_pt',
  'INFRAESTRUTURAS E HABITAÇÃO': '@iestruturas_pt',
  'PRESIDÊNCIA DO CONSELHO DE MINISTROS': '@mpresidencia_pt',
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
  ECONOMIA: '@economia_pt',
  PLANEAMENTO: '@planeamento_pt',
  'MODERNIZAÇÃO DO ESTADO E DA ADMINISTRAÇÃO PÚBLICA': '@modernizacao_pt',
  'COESÃO TERRITORIAL': '@coesao_pt',
};

const re = new RegExp(Object.keys(twitterAccounts).join('|'), 'gi');

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

  const msgDecrees = await Promise.all(decrees.map(async (decree) => {
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

      const strDiscord = `***Nova entrada:***\n${decree.title}\n*${strIssuer}*\n\`\`\`${description}\`\`\`\n:link: <${decreeURL}>\n:file_folder: <${decree.link}>`;

      const repIssuerHandle = () => {
        const hyphenPos = issuer.indexOf('-');

        const strLargeHandles = 'Vários @govpt';

        if (hyphenPos > -1) {
          const handles = issuer.substring(0, hyphenPos)
            .replace(re, matched => twitterAccounts[matched.toUpperCase()]);

          const institutions = issuer.substring(hyphenPos);

          const handlerLen = handles.length;

          if (handlerLen + institutions.length > 90) {
            if (handlerLen < 90) {
              return handles;
            }

            return strLargeHandles;
          }

          return `${handles}${issuer.substring(hyphenPos)}`;
        }

        const strOnlyHandles = issuer
          .replace(re, matched => twitterAccounts[matched.toUpperCase()]);

        if (strOnlyHandles.length < 90) {
          return strOnlyHandles;
        }

        return strLargeHandles;
      };

      const issuerHandle = repIssuerHandle();

      const tweetLength = decree.title.length + issuerHandle.length + decreeURL.length + 15;

      const descLength = description.length;

      const strDescription = tweetLength + descLength < 280
        ? description
        : `${description.substring(0, 274 - tweetLength)} (...)`;

      const tweet = [{
        status: `${decree.title}\n\nEmissor: ${issuerHandle}\n\n${strDescription}\n\n${decreeURL}`,
      }];

      db.Decrees.create({
        link: decree.link,
        title: decree.title,
        description: decree.contentSnippet,
      });

      return {
        discord: strDiscord,
        twitter: tweet,
      };
    }

    return {};
  }));

  const filterNew = msgDecrees.filter(decree => decree.discord !== undefined);

  const msgDiscord = filterNew
    .map(obj => obj.discord)
    .filter(message => message !== '').join('\n\n');

  if (msgDiscord.length > 0) {
    sendMessageToChannel(channel, msgDiscord);
  }

  const tweets = filterNew.map(obj => obj.twitter);

  if (tweets.length > 0) {
    await tweets.reduce(async (previous, tweet) => {
      await previous;

      await new Promise(r => setTimeout(r, 800));

      return uploadThreadTwitter(tweet, '', 'dre');
    }, Promise.resolve());
  }
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
