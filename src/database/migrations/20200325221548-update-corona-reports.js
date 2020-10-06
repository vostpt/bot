module.exports = {
  up: async (queryInterface, Sequelize) => queryInterface.addColumn('CoronaReports', 'md5sum', {
    type: Sequelize.DataTypes.CHAR(32),
  }),
  down: async queryInterface => queryInterface.removeColumn('CoronaReports', 'md5sum'),
};
