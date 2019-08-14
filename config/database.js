module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'data/db.dev.sqlite',
  },
  test: {
    dialect: 'sqlite',
    // the storage engine for sqlite
    // - default ':memory:'
  },
  production: {
    dialect: 'sqlite',
    storage: 'data/db.production.sqlite',
  },
};
