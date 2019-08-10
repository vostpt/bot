const puppeteer = require('puppeteer');
const { FuelApi } = require('../api');

/**
 * Get updated petrol station fuel stats
 *
 * @param {Client} client
 */
const getFuelStats = async () => {
  const { data } = await FuelApi.get();

  return data;
};

/**
* Take screenshot from website
*
* @async
* @param {String} url
* @param {String} photoFilePath
* @param {Object} customSettings
*/
const getFuelScreenshot = async () => {
  const browser = await puppeteer.launch();

  const page = await browser.newPage();

  await page.setJavaScriptEnabled(true);
  await page.setViewport({ width: 1536, height: 400 });
  await page.goto(FuelApi.fuelStatsUrl, { waitUntil: 'networkidle0' });

  const bufStats1 = await page.screenshot({
    clip: {
      x: 0,
      y: 0,
      width: 768,
      height: 400,
    },
    encoding: 'base64',
  });
  const bufStats2 = await page.screenshot({
    clip: {
      x: 768,
      y: 0,
      width: 768,
      height: 400,
    },
    encoding: 'base64',
  });

  await browser.close();

  return [bufStats1, bufStats2];
};

module.exports = {
  getFuelStats,
  getFuelScreenshot,
};
