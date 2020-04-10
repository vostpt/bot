module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('Earthquakes', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    time: {
      type: Sequelize.DATE,
    },
    dataUpdate: {
      type: Sequelize.DATE,
    },
    zone: {
      type: Sequelize.INTEGER,
    },
    degree: {
      type: Sequelize.STRING,
    },
    magType: {
      type: Sequelize.STRING,
    },
    magnitud: {
      type: Sequelize.STRING,
    },
    depth: {
      type: Sequelize.INTEGER,
    },
    obsRegion: {
      type: Sequelize.STRING,
    },
    local: {
      type: Sequelize.STRING,
    },
    lat: {
      type: Sequelize.STRING,
    },
    lon: {
      type: Sequelize.STRING,
    },
    sensed: {
      type: Sequelize.STRING,
    },
    shakemapid: {
      type: Sequelize.STRING,
    },
    shakemapref: {
      type: Sequelize.STRING,
    },
    createdAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
    updatedAt: {
      allowNull: false,
      type: Sequelize.DATE,
    },
  }),
  down: queryInterface => queryInterface.dropTable('Earthquakes'),
};
