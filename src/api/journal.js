const Parser = require('rss-parser');
const { journalSerieI, journalSerieIIGov } = require('../../config/journal');

// Constants
const LOG_PREFIX = '[Journal-API]';
const DECREE_KEYWORD = 'Despacho';

const parser = new Parser();

const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Parse RSS feed with error handling
 * @param {string} url - RSS feed URL
 * @param {number} serie - Journal series number
 */
const parseRSSFeed = async (url, serie) => {
  try {
    const feed = await parser.parseURL(url);
    return feed.items.map(item => ({ ...item, serie }));
  } catch (error) {
    logger.error(`Failed to parse RSS feed: ${url}`, error);
    return [];
  }
};

/**
 * Fetch and combine journal entries from both series
 */
const getJournal = async () => {
  try {
    logger.info('Fetching journal entries');

    const [serieI, serieIIGov] = await Promise.all([
      parseRSSFeed(journalSerieI, 1),
      parseRSSFeed(journalSerieIIGov, 2)
    ]);

    const serieIIDecrees = serieIIGov
      .filter(decree => decree.title.includes(DECREE_KEYWORD))
      .map(item => ({ ...item, serie: 2 }));

    const combinedEntries = [...serieIIDecrees, ...serieI];
    
    logger.info(`Retrieved ${combinedEntries.length} journal entries`);
    return combinedEntries;
  } catch (error) {
    logger.error('Failed to fetch journal entries', error);
    throw error;
  }
};

module.exports = {
  getJournal
};
