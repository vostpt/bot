module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.createTable('CoronaDgsFaqs', {
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
    onsite: {
      type: Sequelize.STRING,
    },
    awaiting: {
      type: Sequelize.BOOLEAN,
    },
    newAnswer: {
      type: Sequelize.BOOLEAN,
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
  down: queryInterface => queryInterface.dropTable('CoronaDgsFaqs'),
};
