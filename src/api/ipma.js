const axios = require('axios');
const cheerio = require('cheerio');

const LOG_PREFIX = '[IPMA-API]';
const IPMA_URL = 'https://www.ipma.pt/pt/index.html';
const WARNING_SCRIPT_PATTERN = /var result_warnings = (.*);/;
const WARNING_LEVELS = ['yellow', 'orange', 'red'];

const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

class IpmaAPI {
  async #extractWarnings($) {
    try {
      const script = $('script')
        .filter(function() {
          return $(this).html().includes('var result_warnings =');
        })
        .first()
        .html();

      if (!script) {
        logger.debug('No warnings script found');
        return [];
      }

      const match = script.match(WARNING_SCRIPT_PATTERN);
      const data = match?.[1] ? JSON.parse(match[1]).data : [];
      
      return data.filter(warning => WARNING_LEVELS.includes(warning.awarenessLevelID));
    } catch (error) {
      logger.error('Failed to extract warnings', error);
      return [];
    }
  }

  async fetch() {
    try {
      logger.info('Fetching IPMA warnings');
      const response = await axios.get(IPMA_URL);
      const $ = cheerio.load(response.data);
      
      const warnings = await this.#extractWarnings($);
      logger.info(`Retrieved ${warnings.length} warnings`);
      
      return warnings;
    } catch (error) {
      if (error.status !== 404) {
        logger.error('Failed to fetch IPMA page', error);
      }
      return [];
    }
  }
}

module.exports = new IpmaAPI();
