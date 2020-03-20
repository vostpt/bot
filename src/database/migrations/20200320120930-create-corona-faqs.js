module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('CoronaFaqs', {
    id: {
      allowNull: false,
      primaryKey: true,
      type: Sequelize.INTEGER,
    },
    question: {
      type: Sequelize.STRING,
    },
    answer: {
      type: Sequelize.STRING,
    },
    entity: {
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
  down: queryInterface => queryInterface.dropTable('CoronaFaqs'),
};
