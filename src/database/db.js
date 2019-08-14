
const Sequelize = require('sequelize');
const dbConfig = require('../../config/database');

// TODO get APP_ENV from env and set the right connection
const sequelize = new Sequelize(dbConfig.development);

/* eslint-disable no-console */
const dbConnection = () => sequelize
  .authenticate()
  .then(() => {
    console.log('Sqlite Connection has been established successfully.');
    return sequelize;
  })
  .catch((err) => {
    console.error('Unable to connect to the Sqlite database:', err);
  });

const closeDbConnection = () => {
  sequelize.close();
  console.log('Sqlite connection closed');
};
/* eslint-enable no-console */

module.exports = {
  dbConnection,
  closeDbConnection,
  sequelize,
};
