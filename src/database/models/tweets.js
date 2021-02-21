const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Tweets extends Model {}

  Tweets.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    reference: {
      type: DataTypes.STRING,
      unique: true,
    },
    lastTweetId: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Tweets',
  });
  return Tweets;
};
