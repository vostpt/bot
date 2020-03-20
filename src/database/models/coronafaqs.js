module.exports = (sequelize, DataTypes) => {
  const CoronaFaqs = sequelize.define('CoronaFaqs', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    question: DataTypes.STRING,
    answer: DataTypes.STRING,
    entity: DataTypes.STRING,
  }, {});
  return CoronaFaqs;
};
