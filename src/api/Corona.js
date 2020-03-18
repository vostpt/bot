const cheerio = require('cheerio');
const ftp = require('basic-ftp');

const api = require('./api');
const { ftpCorona } = require('../../config/ftp');

const dgsReports = 'https://covid19.min-saude.pt/relatorio-de-situacao/';

const getReports = async () => {
  const pageHtml = await api.getHtml(dgsReports);

  const $ = cheerio.load(pageHtml);

  return $('.single_content ul li').map((i, elem) => ({
    link: $(elem).find('a').prop('href'),
    title: $(elem).text(),
  }));
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

module.exports = {
  getReports,
  uploadToFtp,
};
