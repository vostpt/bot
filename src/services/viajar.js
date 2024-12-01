const { VIAJAR } = require('../config/services');
const { channels } = require('../../config/bot');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { countries } = require('../../config/countries');
const { sendMessageToChannel } = require('./discord');

// Constants
const LOG_PREFIX = '[Travel]';
const BASE_URL = 'https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/conselhos-aos-viajantes/';
const DATE_OPTIONS = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric'
};
const PAGE_NOT_FOUND_TEXT = 'Página não encontrada';

/**
 * Custom logger for Travel service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Format country update message
 * @param {Object} update - Update information
 * @returns {String} Formatted message
 */
const formatUpdateMessage = (update) => {
  return `Página do ${update.country} (${update.region}) atualizada hoje, url: ${update.result.url}`;
};

/**
 * Check if a page contains today's date
 * @param {String} url - URL to check
 * @returns {Promise<Object|null>} Page information if updated today
 */
const checkPage = async (url) => {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      logger.warning(`Failed to fetch ${url}: ${response.status} ${response.statusText}`);
      return null;
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    const today = new Date().toLocaleDateString('pt-PT', DATE_OPTIONS);

    // Check if page exists
    const pageNotFound = $(`*:contains("${PAGE_NOT_FOUND_TEXT}")`).text();
    if (pageNotFound) {
      logger.warning(`Page not found: ${url}`);
      return null;
    }

    // Check for today's date
    const foundDate = $(`*:contains(${today})`).text();
    if (foundDate) {
      logger.info(`Found update for ${url}`);
      return { url, date: today };
    }

    return null;
  } catch (error) {
    logger.error(`Error checking page ${url}`, error);
    return null;
  }
};

/**
 * Check for new travel advice across all countries
 * @param {Object} client - Discord client
 */
const checkNewTravelAdvices = async (client) => {
  try {
    if (VIAJAR || !VIAJAR.enabled) {
      logger.warning('Travel service is disabled in configuration');
      return;
    }

    logger.info('Starting travel advice check');
    const regions = Object.keys(countries);
    const newUpdates = [];

    // Check each country in each region
    for (const region of regions) {
      logger.debug(`Checking region: ${region}`);
      
      for (const country of countries[region]) {
        const url = `${BASE_URL}${region}/${country}`;
        const result = await checkPage(url);
        
        if (result) {
          newUpdates.push({ region, country, result });
        }
      }
    }

    // Process updates if any found
    if (newUpdates.length > 0) {
      logger.info(`Found ${newUpdates.length} new updates`);
      
      const formattedUpdates = newUpdates.map(formatUpdateMessage);
      const message = [
        '***✈️✈️✈️Novos Avisos no Portal das Comunidades✈️✈️✈️***',
        ...formattedUpdates
      ].join('\n');

      await sendMessageToChannel(
        client.channels.get(channels.TRAVEL_GUIDELINES), 
        message
      );
      
      logger.info('Sent updates to Discord');
    } else {
      logger.info('No new updates found');
    }
  } catch (error) {
    logger.error('Error checking travel advice', error);
    throw error;
  }
};

module.exports = {
  checkNewTravelAdvices,
};
