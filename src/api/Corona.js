const cheerio = require('cheerio');
const crypto = require('crypto');
const ftp = require('basic-ftp');

const api = require('./api');

const { ftpCorona } = require('../../config/ftp');
const { coronaFaqsURL, coronaFaqsDgsURL } = require('../../config/api');

const dgsReports = 'https://covid19.min-saude.pt/relatorio-de-situacao/';

const md5FromUrl = async (url) => {
  const fileStream = await api.getFileStream(url);

  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('md5');

    fileStream.on('data', data => hash.update(data));
    fileStream.on('end', () => resolve(hash.digest('hex')));

    hash.on('error', (err) => {
      reject(new Error(`Unable to get MD5 hash from report with URL: ${url}\n${err}`));
    });
  });
};

const getReport = async ($elem) => {
  const url = encodeURI($elem.find('a').prop('href'));
  const md5sum = await md5FromUrl(url);

  return new Promise((resolve) => {
    resolve({
      link: url,
      title: $elem.text(),
      md5sum,
    });
  });
};

const getReports = async () => {
  const pageHtml = await api.getHtml(dgsReports);

  // Cheerio is not async, so we need to convert each report entry
  // into a promise, which we can then collect with Promise.all(...)
  const $ = cheerio.load(pageHtml);
  const elements = $('.single_content ul li').get();

  return Promise.all(elements.map(elem => getReport($(elem))));
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

const getFaqs = async () => ({
  coronaFaqs: await api.get(coronaFaqsURL),
  coronaDgsFaqs: await api.get(coronaFaqsDgsURL),
});

module.exports = {
  md5FromUrl,
  getReports,
  uploadToFtp,
  getFaqs,
};
