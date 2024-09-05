const { channels } = require('../../config/bot');
const fetch = require('node-fetch');
const cheerio = require('cheerio');
const { countries } = require('../../config/countries');
const { sendMessageToChannel } = require('./Discord');

const baseUrl = 'https://portaldascomunidades.mne.gov.pt/pt/vai-viajar/conselhos-aos-viajantes/';

async function checkPage(url) {
  try {
    const response = await fetch(url);
    const html = await response.text();
    const $ = cheerio.load(html);

    const today = new Date().toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const pageNotFound = $('*:contains("Página não encontrada")').text();
    if (pageNotFound != "") {
      console.log("Page not found", url);
    }

    const founddate = $(`*:contains(${today})`).text();
    if (founddate != "") {
      const page = { url, date: today};
      return page;
    } else {
      return null;
    }
  } catch (error) {
    console.error(`Error fetching page ${url}:`, error);
    return null;
  }
}

const checkNewTravelAdvices = async (client) => {
  const regions = Object.keys(countries);
  const newUpdates = [];
  for (const region of regions) {
    for (const country of countries[region]) {
      const url = `${baseUrl}${region}/${country}`;
      const result = await checkPage(url);
      if (result) {
        newUpdates.push({ region, country, result});
      }
    }
  }
  const formattedUpdates = newUpdates.map(update => {
    return `Página do ${update.country} (${update.region}) atualizada hoje, url: ${update.result.url}`;
  });

  if (newUpdates.length > 0) {
    sendMessageToChannel(
      client.channels.get(channels.TRAVEL_GUIDELINES), 
      `***✈️✈️✈️Novos Avisos no Portal das Comunidades✈️✈️✈️***\n${formattedUpdates.join('\n')}`
    );
  }
}

module.exports = {
  checkNewTravelAdvices,
};
