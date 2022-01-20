const axios = require('axios');
const cheerio = require('cheerio');

const levels = [
  'yellow',
  'orange',
  'red',
];

class Ipma {
  constructor() {
  }

  // eslint-disable-next-line class-methods-use-this
  async fetch() {
    const warnings = [];
    try {
      // eslint-disable-next-line no-await-in-loop
      const response = await axios.get(`https://www.ipma.pt/pt/index.html`);
      const $ = cheerio.load(response.data);
      // eslint-disable-next-line no-restricted-syntax
      const scripts = $('script').filter(function() {
        return ($(this).html().indexOf('var result_warnings =') > -1);
    });
      if (scripts.length === 1) {
          const warnScript = $(scripts[0]).html();

          const warnings = JSON.parse(warnScript.match(/var result_warnings = (.*);/)[1]).data;
          
          const filteredWarn = warnings.filter((warning) => {
            return levels.includes(warning.awarenessLevelID);
          });

          return filteredWarn;
      }
    } catch (error) {
      if (error.status !== 404) {
        // eslint-disable-next-line no-console
        console.error(error);
        return '';
      }
    }
    return warnings;
  }
}

module.exports = new Ipma();
