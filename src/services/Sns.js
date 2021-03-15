const fetch = require('node-fetch');
const cheerio = require('cheerio');

const url = 'https://www.sns24.gov.pt/alertas/';

/**
 * Get alerts data form SNS24 website
 *
 * @returns {Array} data
 */
const getAlerts = async () => {
  const data = await fetch(url)
    .then((res) => res.text())
    .then((body) => {
      const $ = cheerio.load(body);
      const $alerts = $('article.alerta');

      return $alerts.map((i, el) => (
        {
          title: $(el).find('h2.pag-alertas').text(),
          description: $(el).find('p.pag-alertas').text().trim(),
          link: $(el).find('a.pag-alertar').attr('href'),
          dateTime: $(el).find('time.updated').attr('datetime'),
        }
      )).get();
    });
  return data;
};

module.exports = {
  getAlerts,
};
