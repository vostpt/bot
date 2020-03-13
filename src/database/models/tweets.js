module.exports = (sequelize, DataTypes) => {
  const Tweets = sequelize.define('Tweets', {
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
  }, {});
  return Tweets;
};
