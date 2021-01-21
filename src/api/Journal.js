const Parser = require('rss-parser');

const parser = new Parser();

const { journalSerieI } = require('../../config/journal');

const getJournal = async () => parser.parseURL(journalSerieI).then(result => result.items);

module.exports = {
  getJournal,
};
