module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('MedeaMessages', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      timestamp: {
        type: Sequelize.DATE,
      },
      source: {
        type: Sequelize.STRING,
      },
      entity: {
        type: Sequelize.STRING,
      },
      locationName: {
        type: Sequelize.STRING,
      },
      type: {
        type: Sequelize.STRING,
      },
      target: {
        type: Sequelize.STRING,
      },
      message: {
        type: Sequelize.STRING,
      },
      action: {
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
    await queryInterface.dropTable('MedeaMessages');
  },
};
