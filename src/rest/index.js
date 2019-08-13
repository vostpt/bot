const app = require('express')();
const helmet = require('helmet');
const fuelRoutes = require('./routes/fuel');

const {
  isActive,
  port,
} = require('../../config/rest');

const kickstart = () => {
  if (!isActive) {
    return;
  }

  app.use(helmet());

  app.use('/fuel', fuelRoutes);

  /* eslint-disable no-console */
  app.listen(port, () => console.log(`READY :: Bot REST API listening on port ${port}!`));
};

module.exports = {
  kickstart,
};
