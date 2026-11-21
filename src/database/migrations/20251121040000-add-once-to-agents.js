module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('Agents', 'once', {
      allowNull: false,
      defaultValue: false,
      type: Sequelize.BOOLEAN,
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeColumn('Agents', 'once');
  },
};
