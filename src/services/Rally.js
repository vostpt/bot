/**
  Rally of Portugal services
 */

const fs = require('fs');
const got = require('got');
const csv = require('csv');

const { filePath } = require('../../config/rally');
const { uploadThreadTwitter } = require('./Twitter');
const { postMessageFacebook } = require('./Facebook');
const { sendMessageRally } = require('./Telegram');
const { telegramKeysRally } = require('../../config/telegram');
const { splitMessageString } = require('../helpers');


const capacityLevel = (capacity) => {
  if (capacity > 89) {
    return 4;
  }

  if (capacity > 69) {
    return 3;
  }

  if (capacity > 49) {
    return 2;
  }

  if (capacity > 9) {
    return 1;
  }

  return 0;
};

const levels = {
  3: 'laranja',
  4: 'vermelho',
};

const emojis = {
  3: '🟠',
  4: '🔴',
}

const texts = (zone, stage, level) => {
  const texts = {
    3: {
      pt: `${zone} - ${stage} quase a atingir a sua capacidade limite. Se ainda estás a caminho por favor volta para trás. Pensa em ti e pensa nos outros.`,
      en: `${zone} - ${stage} almost reaching its limit capacity. If you are still on your way please go back. Think of yourself and think of others.`,
      es: `${zone} - ${stage} casi alcanza su capacidad límite. Si todavía estás en camino, regresa. Piensa en ti mismo y piensa en los demás.`
    },
    4: {
      pt: `${zone} - ${stage} atingiu o limite da sua capacidade. Por favor, não te desloques para o local. Pensa em ti e pensa nos outros.`,
      en: `${zone} - ${stage} has reached the limit of its capacity. Please do not move to the location. Think of yourself and think of others.`,
      es: `${zone} - ${stage} ha alcanzado el límite de su capacidad. Por favor, no se mueva a la ubicación. Piensa en ti mismo y piensa en los demás.`
    }
  };
  
  return texts[level];
};

/**
 * Read csv file
 *
 * @async
 */
const readCsv = async () => {
  const csvData = [];

  const parser = fs
    .createReadStream(filePath)
    .pipe(csv.parse({
      header: true,
      columns: true,
    })
  );

  for await (const record of parser) {
    csvData.push(record)
  }

  return csvData;
};

/**
 * Write csv file
 *
 * @async
 * @param {Object} data
 */
 const writeCsv = async (data) => {
  csv.stringify(data, {
    header: true
  }, (err, output) => {
    fs.writeFile(filePath, output, (err) => {
      if (err) {
        throw new Error();
      }
    });
  });
};

/**
 * Check new decrees. If exists, send to Discord
 *
 * @async
 * @param {String} zone
 * @param {String} newCapacity
 */
const updateCapacity = async (zone, newCapacity) => {

  const csvData = await readCsv();

  const zoneUpperCase = zone.toUpperCase();

  const searchZone = csvData.findIndex((csvZone) => {
    return csvZone.name.toUpperCase() === zoneUpperCase;
  });

  if (searchZone < 0) {
    return -1;
  }

  const oldCapacity = csvData[searchZone].capacity;

  csvData[searchZone].capacity = newCapacity;

  csvData[searchZone].label = `${csvData[searchZone].stage} -- ${csvData[searchZone].name} - Lotação: ${csvData[searchZone].capacity}%`;

  await publishSocialMedia(csvData[searchZone], oldCapacity);
  
  await writeCsv(csvData);

  return 0;
};

/**
 * Publish rally updates to social media
 *
 * @async
 * @param {Object} zoneObject
 * @param {Number} oldCapacity
 */
const publishSocialMedia = async (zoneObject, oldCapacity) => {
  const oldLevel = capacityLevel(oldCapacity);
  const newLevel = capacityLevel(zoneObject.capacity);

  if (newLevel < 3 || newLevel <= oldLevel) {
    return;
  }
  
  const postTexts = texts(zoneObject.name, zoneObject.stage, newLevel);

  const twFileName = `rally_pt/${levels[newLevel]}_VRP21_tw.jpg`;

  const thread = [{
    status: `${emojis[newLevel]} ${postTexts['pt']} ${emojis[newLevel]}\n\nhttps://rally.vost.pt\n\n#RallyPortugal2021`,
    media: [twFileName],
  },
  {
    status: `${emojis[newLevel]} ${postTexts['en']} ${emojis[newLevel]}\n\nhttps://rally.vost.pt\n\n#RallyPortugal2021`,
  },
  {
    status: `${emojis[newLevel]} ${postTexts['es']} ${emojis[newLevel]}\n\nhttps://rally.vost.pt\n\n#RallyPortugal2021`,
  }];

  uploadThreadTwitter(thread, '', 'rally');

  const joinText = `${emojis[newLevel]} ${postTexts['pt']}\n\n${postTexts['en']}\n\n${postTexts['es']} ${emojis[newLevel]}\n\nhttps://rally.vost.pt\n\n#RallyPortugal2021`;

  const tlgMessage = {
    chatId: telegramKeysRally.chat_id,
    text: joinText,
  };

  sendMessageRally(tlgMessage);

  const fbFileName = `rally_pt/${levels[newLevel]}_VRP21_fb.jpg`;
  
  const fbpost = {
    message: joinText,
    media: fbFileName,
  }

  postMessageFacebook(fbpost, 'rally');
};

/**
 * Upload csv to site, without sending notification to social media
 *
 * @async
 * @param {String} csvUrl
 */
const uploadCsv = async (csvUrl) => {
  await got.stream(csvUrl).pipe(fs.createWriteStream(filePath));
};

/**
 * Send info to social media
 *
 * @async
 * @param {String} info
 */
const sendInfo = async (info) => {
  const twFileName = 'rally_pt/info_VRP21_tw.png';

  const splitStrTwitter = splitMessageString(info, 225).map((string) => ({
    status: `ℹ️ ${string} ℹ️\n\nhttps://rally.vost.pt\n#RallyPortugal2021`,
  }));

  const tlgFbString = `ℹ️ ${info} ℹ️`;

  splitStrTwitter[0].media = [twFileName];

  uploadThreadTwitter(splitStrTwitter, '', 'rally');

  const fbFileName = 'rally_pt/info_VRP21_fb.png';

  const fbpost = {
    message: `${tlgFbString}\n\nhttps://rally.vost.pt\n\n#RallyPortugal2021`,
    media: fbFileName,
  }

  postMessageFacebook(fbpost, 'rally');


  const tlgMessage = {
    chatId: telegramKeysRally.chat_id,
    text: info,
  };

  sendMessageRally(tlgMessage);
};

module.exports = {
  updateCapacity,
  uploadCsv,
  sendInfo,
};
