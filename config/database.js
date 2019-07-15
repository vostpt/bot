const path = require('path'); 

module.exports = {
  dialect: 'sqlite',
  storage: path.resolve('./src/database/database.sqlite'),
};
