const Jobs = require('../jobs');

const ready = (client) => {
  new Jobs(client).startAll();
};

module.exports = ready;
