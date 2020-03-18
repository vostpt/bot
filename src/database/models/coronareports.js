module.exports = (sequelize, DataTypes) => {
  const CoronaReports = sequelize.define('CoronaReports', {
    title: DataTypes.TEXT,
    link: DataTypes.TEXT,
  }, {});

  return CoronaReports;
};
