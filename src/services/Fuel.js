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
* Take graphs screenshot from 'Já Não Dá Para Abastecer' website
*
* @async
* @param {String} url
* @param {String} photoFilePath
* @param {Object} customSettings
*/
const getFuelStatsGraphs = async () => {
  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const pageJndpa = await browser.newPage();

  await pageJndpa.setJavaScriptEnabled(true);
  await pageJndpa.setViewport({ width: 1536, height: 450 });
  await pageJndpa.goto(FuelApi.fuelStatsUrl, { waitUntil: 'networkidle0' });

  const pageEsri = await browser.newPage();

  await pageEsri.setJavaScriptEnabled(true);
  await pageEsri.setViewport({ width: 1536, height: 768 });
  await pageEsri.goto(FuelApi.esriFuelStatsUrl, { waitUntil: 'networkidle0' });
  
  const generalStatsGraph = await pageJndpa.screenshot({
    clip: {
      x: 0,
      y: 0,
      width: 768,
      height: 400,
    },
    encoding: 'base64',
  });

  const aggTotalsGraph = await pageJndpa.screenshot({
    clip: {
      x: 768,
      y: 0,
      width: 768,
      height: 450,
    },
    encoding: 'base64',
  });

  const arcgisGraph = await pageEsri.screenshot({
    clip: {
      x: 0,
      y: 0,
      width: 1536,
      height: 768,
    },
    encoding: 'base64',
  });

  await browser.close();

  return [generalStatsGraph, aggTotalsGraph, arcgisGraph];
};

module.exports = {
  getFuelStats,
  getFuelStatsGraphs,
};
