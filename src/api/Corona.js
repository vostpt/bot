const cheerio = require('cheerio');
const api = require('./api');

const dgsReports = 'https://covid19.min-saude.pt/relatorio-de-situacao/';

const getReports = async () => {
  const data = [];
  const pageHtml = await api.getHtml(dgsReports);

  const $ = cheerio.load(pageHtml);

  $('.single_content ul li').each((i, elem) => {
    data.push({
      link: $(elem).find('a').prop('href'),
      title: $(elem).text(),
    });
  });

  return data;
};

module.exports = {
  getReports,
};
