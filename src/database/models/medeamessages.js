const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class MedeaMessages extends Model {}

  MedeaMessages.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    timestamp: DataTypes.DATE,
    source: DataTypes.STRING,
    entity: DataTypes.STRING,
    locationName: DataTypes.STRING,
    type: DataTypes.STRING,
    target: DataTypes.STRING,
    message: DataTypes.STRING,
    action: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'MedeaMessages',
  });
  return MedeaMessages;
};
