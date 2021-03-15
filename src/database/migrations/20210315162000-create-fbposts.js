module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.createTable('FbPosts', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV4,
    },
    reference: {
      allowNull: false,
      unique: true,
      type: Sequelize.STRING,
    },
    lastPostId: {
      allowNull: false,
      type: Sequelize.INTEGER,
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
  down: async queryInterface => queryInterface.dropTable('FbPosts'),
};
