module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn('CoronaReports', 'md5sum', {
    type: Sequelize.DataTypes.CHAR(32),
  }),
  down: queryInterface => queryInterface.removeColumn('CoronaReports', 'md5sum'),
};
