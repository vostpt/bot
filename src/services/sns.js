const { SNS } = require('../config/services');
const fetch = require('node-fetch');
const cheerio = require('cheerio');

// Constants
const LOG_PREFIX = '[SNS]';
const SNS_URL = 'https://www.sns24.gov.pt/alertas/';
const SELECTORS = {
  article: 'article.alerta',
  title: 'h2.pag-alertas',
  description: 'p.pag-alertas',
  link: 'a.pag-alertar',
  dateTime: 'time.updated'
};

/**
 * Custom logger for SNS service
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

/**
 * Parse alert data from HTML element
 * @param {CheerioElement} element - HTML element
 * @param {CheerioAPI} $ - Cheerio instance
 * @returns {Object} Alert data
 */
const parseAlertElement = ($, element) => ({
  title: $(element).find(SELECTORS.title).text(),
  description: $(element).find(SELECTORS.description).text().trim(),
  link: $(element).find(SELECTORS.link).attr('href'),
  dateTime: $(element).find(SELECTORS.dateTime).attr('datetime')
});

/**
 * Fetch and parse alerts from SNS24 website
 * @returns {Promise<Array>} Array of alerts
 */
const getAlerts = async () => {
  try {
    if (!SNS || !SNS.enabled) {
      logger.warning('SNS service is disabled');
      return [];
    }
    logger.info('Fetching SNS alerts');

    const response = await fetch(SNS_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const body = await response.text();
    const $ = cheerio.load(body);
    const $alerts = $(SELECTORS.article);

    logger.info(`Found ${$alerts.length} alerts`);

    const alerts = $alerts
      .map((_, element) => parseAlertElement($, element))
      .get();

    // Validate parsed data
    const validAlerts = alerts.filter(alert => {
      const isValid = alert.title && alert.description;
      if (!isValid) {
        logger.warning('Found invalid alert data', alert);
      }
      return isValid;
    });

    logger.info(`Successfully parsed ${validAlerts.length} valid alerts`);
    return validAlerts;

  } catch (error) {
    logger.error('Failed to fetch SNS alerts', error);
    throw error;
  }
};

module.exports = {
  getAlerts,
};
