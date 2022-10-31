/**
 */
const csv = require('csv');
const { DateTime } = require('luxon');

const { db } = require('../database/models');
const { csvURL } = require('../../config/medea');
const { api } = require('../api');
const { uploadThreadTwitter } = require('./Twitter');
const { splitMessageString } = require('../helpers');

 /**
  * Check if a message is present in local DB
  *
  * @param {Object} msg
  * @async
  */
  const filterWarn = async (msg) => {
    if (msg.target !== 'public' || msg.message === '') {
      return false;
    }
  
    const result = await db.MedeaMessages.findOne({
      attributes: [
        'timestamp',
        'source',
        'entity',
        'locationName',
        'type',
        'target',
        'message',
        'action',

      ],
      where: {
        timestamp: msg.timestamp,
        source: msg.source,
        entity: msg.entity,
        locationName: msg.locationName,
        type: msg.type,
        target: msg.target,
        message: msg.message,
        action: msg.action,
      },
    });
  
    return (result === null);
  };


/**
 * Read csv file
 *
 * @async
 */
 const readCsv = async () => {
  const csvData = [];

  const csvStream = await api.getFileStream(csvURL);
  
  const csvParser = csvStream.pipe(csv.parse({
      header: true,
      columns: true,
    }));

  for await (const record of csvParser) {
    csvData.push(record);
  }

  return csvData;
};


/**
* Fetch Midea messages, and pubish to Twitter new messages that are targeted to the public
*
* @async
*/
const getMessages = async () => {
  const messages = (await readCsv()).map((msg) => ({
    timestamp: DateTime.fromFormat(msg.Timestamp, 'y/LL/dd HH:mm:ss').toJSDate(),
    source: msg.SOURCE,
    entity: msg.ENTITY,
    locationName: msg.LOCATION_NAME,
    type: msg.TYPE,
    target: msg.TARGET.toLowerCase(),
    message: msg.MESSAGE,
    action: msg.ACTION,
  }));

  const newMsg = await Promise.all(messages.map((msg) => filterWarn(msg)))
    .then((newSrchRes) => messages.filter(((_message, i) => newSrchRes[i])));

  const fileName = 'medea/MEDEA_Exercise_Twitter_Post.png';

   newMsg.forEach(async (msg) => {
    await db.MedeaMessages.create({
      ...msg,
    });

    const strTwitter = `#LIVEX #MEDEAPoC ${msg.message}`;

    const splitStrTwitter = splitMessageString(strTwitter, 280).map((string) => ({
      status: string,
    }));

    splitStrTwitter[0].media = [fileName];

    uploadThreadTwitter(splitStrTwitter, '', 'vostptia');
  });
};

module.exports = {
  getMessages,
};
