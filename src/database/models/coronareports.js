const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class CoronaReports extends Model {}

  CoronaReports.init({
    title: DataTypes.TEXT,
    link: DataTypes.TEXT,
    md5sum: DataTypes.CHAR(32),
  }, {
    sequelize,
    modelName: 'CoronaReports',
  });
  return CoronaReports;
};
