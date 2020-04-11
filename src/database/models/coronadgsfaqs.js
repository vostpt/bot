module.exports = (sequelize, DataTypes) => {
  const CoronaDgsFaqs = sequelize.define('CoronaDgsFaqs', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    question: DataTypes.STRING,
    answer: DataTypes.STRING,
    entity: DataTypes.STRING,
    onsite: DataTypes.STRING,
    awaiting: DataTypes.BOOLEAN,
    newAnswer: DataTypes.BOOLEAN,
  }, {});
  return CoronaDgsFaqs;
};
