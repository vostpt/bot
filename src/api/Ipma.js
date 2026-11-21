const axios = require('axios');
const cheerio = require('cheerio');

const levels = ['yellow', 'orange', 'red'];

class Ipma {
  async fetch() {
    try {
      const response = await axios.get('https://www.ipma.pt/pt/index.html');
      const $ = cheerio.load(response.data);
      const scripts = $('script').filter(function filterWarningScript() {
        return ($(this).html() || '').includes('var result_warnings =');
      });

      if (scripts.length !== 1) return [];

      const warningScript = $(scripts[0]).html();
      const match = warningScript.match(/var result_warnings = (.*);/);
      if (!match) return [];

      const warnings = JSON.parse(match[1]).data || [];
      return warnings.filter((warning) => levels.includes(warning.awarenessLevelID));
    } catch (error) {
      console.error('[IPMA] Unable to fetch warnings:', error.message);
      return [];
    }
  }
}

module.exports = new Ipma();
