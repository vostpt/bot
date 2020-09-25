const firebAdmin = require('firebase-admin');

const { firebaseConfig } = require('../../config/Firebase');

const sendNotification = async (notifMsg) => {
  const msgObject = notifMsg;

  return firebAdmin.messaging().send(msgObject);
};

firebAdmin.initializeApp(firebaseConfig);

module.exports = {
  sendNotification,
};
