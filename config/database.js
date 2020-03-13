module.exports = {
  development: {
    dialect: 'sqlite',
    storage: 'data/db.dev.sqlite',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },
  test: {
    dialect: 'sqlite',
    storage: 'data/db.test.sqlite',
  },
  production: {
    dialect: 'sqlite',
    storage: 'data/db.production.sqlite',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000,
    },
  },

  NODE_ENV: process.env.NODE_ENV,
};
