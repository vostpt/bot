const axios = require('axios');
const cheerio = require('cheerio');

// Constants
const LOG_PREFIX = '[MeteoAlarm-API]';
const BASE_URL = 'https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-';
const SEVERE_LEVELS = ['orange', 'red'];

class MeteoAlarmAPI {
  constructor() {
    this.countries = [
      'austria', 'belgium', 'bosnia-herzegovina', 'bulgaria', 'croatia',
      'cyprus', 'czechia', 'denmark', 'estonia', 'finland', 'france',
      'germany', 'greece', 'hungary', 'iceland', 'ireland', 'israel',
      'italy', 'latvia', 'lithuania', 'luxembourg', 'malta', 'moldova',
      'montenegro', 'netherlands', 'republic-of-north-macedonia', 'norway',
      'poland', 'portugal', 'romania', 'serbia', 'slovakia', 'slovenia',
      'spain', 'sweden', 'switzerland', 'united-kingdom'
    ];
  }

  /**
   * Parse warning entry from XML
   */
  parseWarningEntry($, entry) {
    const element = $(entry);
    const [severity, type] = element.find('title').text().split(' ');
    
    return {
      type: type.toLowerCase(),
      status: element.find('cap\\:message_type').text(),
      start: element.find('cap\\:effective').text(),
      end: element.find('cap\\:expires').text(),
      severity: severity.toLowerCase(),
      region: element.find('cap\\:areaDesc').text()
    };
  }

  /**
   * Fetch warnings for a single country
   */
  async fetchSingle(countryCode) {
    try {
      const response = await axios.get(`${BASE_URL}${countryCode}`);
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const warnings = $('entry')
        .get()
        .map(entry => this.parseWarningEntry($, entry))
        .filter(warning => SEVERE_LEVELS.includes(warning.severity));

      console.log(`${LOG_PREFIX} Retrieved ${warnings.length} warnings for ${countryCode}`);
      return warnings;

    } catch (error) {
      if (error.status !== 404) {
        console.error(`${LOG_PREFIX} Error fetching ${countryCode}:`, error);
      } else {
        console.log(`${LOG_PREFIX} No data available for ${countryCode}`);
      }
      return [];
    }
  }

  /**
   * Fetch warnings for all countries
   */
  async fetch() {
    console.log(`${LOG_PREFIX} Starting warning fetch for all countries`);
    const allCountries = {};

    for (const country of this.countries) {
      allCountries[country] = await this.fetchSingle(country);
    }

    const totalWarnings = Object.values(allCountries)
      .reduce((sum, warnings) => sum + warnings.length, 0);
    console.log(`${LOG_PREFIX} Retrieved ${totalWarnings} total warnings`);

    return allCountries;
  }
}

module.exports = new MeteoAlarmAPI();
