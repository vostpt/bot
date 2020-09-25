const firebAdmin = require('firebase-admin');

const serviceAccount = require('../../data/auth/estamos-on-covid19-firebase-adminsdk-94dr5-549675da43.json');

const firebaseConfig = {
  credential: firebAdmin.credential.cert(serviceAccount),
  databaseURL: 'https://estamos-on-covid19.firebaseio.com',
};

const sendNotification = async (notifMsg) => {
  const msgObject = notifMsg;

  return firebAdmin.messaging().send(msgObject);
};

firebAdmin.initializeApp(firebaseConfig);

module.exports = {
  sendNotification,
};
