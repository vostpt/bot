const fetch = require('node-fetch');

const { fbaseKey } = require('../../config/firebase');

const headers = {
  Accept: 'application/json',
  'Content-Type': 'application/json',
  Authorization: fbaseKey,
};

const sendNotification = async (notifMsg) => {
  const body = {
    to: notifMsg.topic,
    notification: {
      ...notifMsg.notification,
      sound: 'default',
    },
  };

  return fetch('https://fcm.googleapis.com/fcm/send', {
    method: 'post',
    body: JSON.stringify(body),
    headers,
  }).then(res => res.text());
};

module.exports = {
  sendNotification,
};
