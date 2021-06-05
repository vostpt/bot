const axios = require('axios');
const cheerio = require('cheerio');

class MeteoAlarm {
  constructor() {
    this.countries = [
      'austria',
      'belgium',
      'bosnia-herzegovina',
      'bulgaria',
      'croatia',
      'cyprus',
      'czechia',
      'denmark',
      'estonia',
      'finland',
      'france',
      'germany',
      'greece',
      'hungary',
      'iceland',
      'ireland',
      'israel',
      'italy',
      'latvia',
      'lithuania',
      'luxembourg',
      'malta',
      'moldova',
      'montenegro',
      'netherlands',
      'republic-of-north-macedonia',
      'norway',
      'poland',
      'portugal',
      'romania',
      'serbia',
      'slovakia',
      'slovenia',
      'spain',
      'sweden',
      'switzerland',
      'united-kingdom',
    ];
  }

  async fetch() {
    const allCountries = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const country of this.countries) {
      // eslint-disable-next-line no-await-in-loop
      const warnings = await this.fetchSingle(country);
      allCountries[country] = warnings;
    }
    return allCountries;
  }

  // eslint-disable-next-line class-methods-use-this
  async fetchSingle(countryShortcode) {
    const warnings = [];
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await axios.get(`https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${countryShortcode}`);
      const $ = cheerio.load(response.data, {
        xmlMode: true,
      });
      const entries = $('entry').get();
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of entries) {
        const cheerioElement = $(entry);
        const title = cheerioElement.find('title').text().split(' ');
        const status = cheerioElement.find('cap\\:message_type').text();
        const start = cheerioElement.find('cap\\:effective').text();
        const end = cheerioElement.find('cap\\:expires').text();
        const region = cheerioElement.find('cap\\:areaDesc').text();
        
        const severity = title[0].toLowerCase();
        const type = title[1].toLowerCase();

        if (severity === 'orange' || severity === 'red') {
          warnings.push({
            type,
            status,
            start,
            end,
            severity,
            region,
          });
        }
      }
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error(error);
        return [];
      }

      // eslint-disable-next-line no-console
      console.log(`MeteoAlarm: Missing countrycode ${countryShortcode}`);
    }
    return warnings;
  }
}

module.exports = new MeteoAlarm();
