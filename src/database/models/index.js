const fs = require('fs');
const path = require('path');
const { Sequelize, Op } = require('sequelize');

// Constants
const LOG_PREFIX = '[Database]';
const basename = path.basename(__filename);
const env = process.env.NODE_ENV || 'development';
const config = require('../../../config/database.js')[env];

/**
 * Custom logger for database operations
 */
const logger = {
  info: (message) => console.log(`${LOG_PREFIX} ${message}`),
  error: (message, error) => console.error(`${LOG_PREFIX} ERROR: ${message}`, error),
  warning: (message) => console.warn(`${LOG_PREFIX} WARNING: ${message}`),
  debug: (message) => console.debug(`${LOG_PREFIX} DEBUG: ${message}`)
};

const db = {};
let sequelize;

logger.info(`Initializing database connection for environment: ${env}`);

try {
  if (config.use_env_variable) {
    logger.debug(`Using environment variable: ${config.use_env_variable}`);
    sequelize = new Sequelize(process.env[config.use_env_variable], config);
  } else {
    logger.debug('Using direct database configuration');
    sequelize = new Sequelize(config.database, config.username, config.password, config);
  }

  logger.debug('Loading model files from directory');
  fs
    .readdirSync(__dirname)
    .filter(file => (file.indexOf('.') !== 0) && (file !== basename) && (file.slice(-3) === '.js'))
    .forEach((file) => {
      logger.debug(`Loading model from file: ${file}`);
      try {
        const model = require(path.join(__dirname, file))(sequelize, Sequelize.DataTypes);
        db[model.name] = model;
        logger.debug(`Successfully loaded model: ${model.name}`);
      } catch (error) {
        logger.error(`Failed to load model from file: ${file}`, error);
        throw error;
      }
    });

  logger.debug('Setting up model associations');
  Object.keys(db).forEach((modelName) => {
    if (db[modelName].associate) {
      try {
        db[modelName].associate(db);
        logger.debug(`Successfully set up associations for model: ${modelName}`);
      } catch (error) {
        logger.error(`Failed to set up associations for model: ${modelName}`, error);
        throw error;
      }
    }
  });

  db.sequelize = sequelize;
  db.Sequelize = Sequelize;

  logger.info('Database initialization completed successfully');
} catch (error) {
  logger.error('Failed to initialize database', error);
  throw error;
}

// Test database connection
sequelize
  .authenticate()
  .then(() => {
    logger.info('Database connection has been established successfully');
  })
  .catch((error) => {
    logger.error('Unable to connect to the database:', error);
  });

module.exports = {
  db,
  Op,
};
