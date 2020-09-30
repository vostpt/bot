const axios = require('axios');
const cheerio = require('cheerio');

class MeteoAlarm {
  constructor() {
    this.countries = [
      'AT',
      'BA',
      'BE',
      'BG',
      'CH',
      'CZ',
      'DK',
      'EE',
      'ES',
      'FI',
      'FR',
      'GR',
      'HR',
      'HU',
      'IE',
      'IS',
      'IT',
      'LT',
      'LU',
      'LV',
      'MD',
      'ME',
      'MK',
      'MT',
      'NL',
      'NO',
      'PL',
      'PT',
      'RO',
      'RS',
      'SE',
      'SI',
      // 'CY',
      // 'DE',
      // 'SK',
      // 'GB',
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
      const response = await axios.get(`https://www.meteoalarm.eu/ATOM/${countryShortcode}.xml`);
      const $ = cheerio.load(response.data, {
        xmlMode: true,
      });
      const entries = $('entry').get();
      // eslint-disable-next-line no-restricted-syntax
      for (const entry of entries) {
        const cheerioElement = $(entry);
        const type = cheerioElement.find('cap\\:event').text();
        const status = cheerioElement.find('cap\\:msgType').text();
        const start = cheerioElement.find('cap\\:effective').text();
        const end = cheerioElement.find('cap\\:expires').text();
        const severity = cheerioElement.find('cap\\:severity').text();
        const region = cheerioElement.find('cap\\:areaDesc').text();
        warnings.push({
          type,
          status,
          start,
          end,
          severity,
          region,
        });
      }
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error(error);
      } else {
        // eslint-disable-next-line no-console
        console.log(`MeteoAlarm: Missing countrycode ${countryShortcode}`);
      }
    }
    return warnings;
  }
}

module.exports = new MeteoAlarm();
