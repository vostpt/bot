/**
  The Official Journal services
 */

const moment = require('moment');
const { db, Op } = require('../database/models');
const { JournalApi } = require('../api');
const { channels } = require('../../config/bot');
const { sendMessageToChannel } = require('./Discord');
const { uploadThreadTwitter } = require('./Twitter');
const { sendPostMastodon } = require('./Mastodon');

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
  'PRESIDÊNCIA DA REPÚBLICA': '@presidencia',
};

const serieNo = {
  1: 'I',
  2: 'II',
};

const re = new RegExp(Object.keys(twitterAccounts).join('|'), 'gi');

/**
 * Check if the decree link/URL is not in database
 *
 * @param {Object} decree
 */
const decreeNotInDb = (decree) => db.Decrees.findOne({
  where: {
    link: decree.link,
  },
})
  .then((result) => result === null);

/**
 * Check new decrees. If exists, send to Discord
 *
 * @async
 * @param {Object} client
 */
const checkNewDecrees = async (client) => {
  const decrees = await JournalApi.getJournal();

  const msgDecrees = await Promise.all(decrees.map(async (decree) => {
    const notInDb = await decreeNotInDb(decree);

    if (notInDb) {
      db.Decrees.create({
        link: decree.link,
        title: decree.title,
        description: decree.contentSnippet,
      });

      const splitDescription = decree.contentSnippet.split('\n');

      const issuer = splitDescription.shift();

      const description = splitDescription.join('\n');

      const strIssuer = `Emitido por: ${issuer}`;

      const strDiscord = `***Nova entrada - Série ${serieNo[decree.serie]}:***\n${decree.title}\n*${strIssuer}*\n\`\`\`${description}\`\`\`\n:link: <${decree.link}>\n`;

      const strMastodon = `${decree.title}\n\nEmissor: ${issuer}\n\n${description}\n\n${decree.link}`;

      if (decree.serie === 1) {
        const repIssuerHandle = () => {
          const hyphenPos = issuer.indexOf('-');

          const strLargeHandles = 'Vários @govpt';

          if (hyphenPos > -1) {
            const handles = issuer.substring(0, hyphenPos)
              .replace(re, (matched) => twitterAccounts[matched.toUpperCase()]);

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
            .replace(re, (matched) => twitterAccounts[matched.toUpperCase()]);

          if (strOnlyHandles.length < 90) {
            return strOnlyHandles;
          }

          return strLargeHandles;
        };

        const issuerHandle = repIssuerHandle();

        const tweetLength = decree.title.length + issuerHandle.length + decree.link.length + 15;

        const descLength = description.length;

        const strDescription = tweetLength + descLength < 280
          ? description
          : `${description.substring(0, 274 - tweetLength)} (...)`;

        const tweet = [{
          status: `${decree.title}\n\nEmissor: ${issuerHandle}\n\n${strDescription}\n\n${decree.link}`,
        }];

        return {
          discord: strDiscord,
          twitter: tweet,
          mastodon: strMastodon,
        };
      }

      return {
        discord: strDiscord,
      };
    }

    return {};
  }));

  const filterNew = msgDecrees.filter((decree) => decree.discord !== undefined);

  const msgDiscord = filterNew
    .map((obj) => obj.discord)
    .filter((message) => message !== '').join('\n\n');

  if (msgDiscord.length > 0) {
    const channel = client.channels.get(channels.JOURNAL_CHANNEL_ID);

    sendMessageToChannel(channel, msgDiscord);
  }

  const publicPosts = filterNew
    .filter(decree => decree.twitter !== undefined);

  const mastoPosts = publicPosts.map(obj => obj.mastodon);

  mastoPosts.forEach((post) => {
    sendPostMastodon({
      status: post,
      options: {
        spoiler_text: 'Novo decreto',
        sensitive: false,
        language: 'pt',
      },
    }, 'dre');
  });

  const tweets = publicPosts.map(obj => obj.twitter);

  const twLength = tweets.length;

  if (twLength > 0) {
    const interval = twLength > 15
      ? 10000
      : 1000;

    await tweets.reduce(async (previous, tweet) => {
      await previous;

      await new Promise((r) => setTimeout(r, interval));

      return uploadThreadTwitter(tweet, '', 'dre');
    }, Promise.resolve());
  }
};

const clearDb = async () => {
  const dateLimit = moment().subtract('7', 'days').format('YYYY-MM-DD');

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
