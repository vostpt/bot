module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('IpmaWarnings', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      idAreaAviso: {
        type: Sequelize.STRING,
      },
      awarenessTypeName: {
        type: Sequelize.STRING,
      },
      startTime: {
        type: Sequelize.DATE,
      },
      endTime: {
        type: Sequelize.DATE,
      },
      awarenessLevelID: {
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
    });
  },
  down: async (queryInterface) => {
    await queryInterface.dropTable('IpmaWarnings');
  },
};
