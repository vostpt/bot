module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.createTable('Decrees', {
    id: {
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    link: {
      allowNull: false,
      unique: true,
      type: Sequelize.STRING,
    },
    title: {
      allowNull: false,
      type: Sequelize.STRING,
    },
    description: {
      allowNull: false,
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
  down: async queryInterface => queryInterface.dropTable('Decrees'),
};
