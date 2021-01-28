const Parser = require('rss-parser');

const parser = new Parser();

const { journalSerieI, journalSerieIIGov } = require('../../config/journal');

const getJournal = async () => {
  const serieI = await parser.parseURL(journalSerieI).then(result => result.items);

  const serieIIGov = await parser.parseURL(journalSerieIIGov).then(result => result.items);

  const serieIIGovFilt = serieIIGov.filter(decree => decree.title.includes('Despacho'));

  return [...serieI, ...serieIIGovFilt];
};

module.exports = {
  getJournal,
};
