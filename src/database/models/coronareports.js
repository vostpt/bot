module.exports = (sequelize, DataTypes) => {
  const CoronaReports = sequelize.define('CoronaReports', {
    title: DataTypes.TEXT,
    link: DataTypes.TEXT,
    md5sum: DataTypes.CHAR(32),
  }, {});

  return CoronaReports;
};
