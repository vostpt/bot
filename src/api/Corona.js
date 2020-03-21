const cheerio = require('cheerio');
const ftp = require('basic-ftp');
const neatCsv = require('neat-csv');

const api = require('./api');

const { ftpCorona } = require('../../config/ftp');
const { coronaFaqsURL, govFaqsURL } = require('../../config/api');

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

const uploadToFtp = async (report) => {
  const client = new ftp.Client();

  await client.access({
    host: ftpCorona.server,
    user: ftpCorona.user,
    password: ftpCorona.password,
    secure: true,
  });

  await client.ensureDir('/public_html/mirror');

  const fileStream = await api.getFileStream(report.link);

  const fileName = report.link.substring(report.link.lastIndexOf('/') + 1);

  await client.uploadFrom(fileStream, fileName);
};

const getCsv = async (url, headers) => neatCsv(await api.getFileStream(url), {
  headers,
  skipLines: 1,
});

const getFaqs = async () => {
  const coronaResults = await getCsv(coronaFaqsURL, ['question', 'answer', 'entity', 'hashtag']);

  const govResults = await getCsv(govFaqsURL, ['area', 'question', 'answer', 'entity', 'onsite']);

  return {
    coronaResults,
    govResults,
  };
};

module.exports = {
  getReports,
  uploadToFtp,
  getFaqs,
};
