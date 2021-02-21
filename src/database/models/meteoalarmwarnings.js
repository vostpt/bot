const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MeteoAlarmWarnings extends Model {}

  MeteoAlarmWarnings.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    country: DataTypes.STRING,
    region: DataTypes.STRING,
    type: DataTypes.STRING,
    status: DataTypes.STRING,
    start: DataTypes.DATE,
    end: DataTypes.DATE,
    severity: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'MeteoAlarmWarnings',
  });
  return MeteoAlarmWarnings;
};
