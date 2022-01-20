const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class IpmaWarnings extends Model {}

  IpmaWarnings.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    idAreaAviso: DataTypes.STRING,
    awarenessTypeName: DataTypes.STRING,
    startTime: DataTypes.DATE,
    endTime: DataTypes.DATE,
    awarenessLevelID: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'IpmaWarnings',
  });
  return IpmaWarnings;
};
