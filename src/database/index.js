const Sequelize = require('sequelize');
const path = require('path');
const database = require('../../config/database');

/**
* EDITAR ISTO!! (Se isto aparecer no Git é mau sinal :( )
*
* @param {Client} client
*/

class Database {
  constructor() {
  	console.log('entrou aqui');
    this.sequelize = new Sequelize(database);
  }

  startDb() {
    this.sequelize
      .authenticate()
      .then(() => {
        // eslint-disable-next-line no-console
        console.log('Sqlite connection OK');
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.error('Unable to connect to database', err);
      });
  }

  stopDb() {
    this.sequelize.close();
    // eslint-disable-next-line no-console
    console.log('Sqlite connection closed');
  }
}

module.exports = Database;
