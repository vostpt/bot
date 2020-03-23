module.exports = (sequelize, DataTypes) => {
  const CoronaFaqs = sequelize.define('CoronaFaqs', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    area: DataTypes.STRING,
    question: DataTypes.STRING,
    answer: DataTypes.STRING,
    entity: DataTypes.STRING,
    onsite: DataTypes.STRING,
    awaiting: DataTypes.BOOLEAN,
    newAnswer: DataTypes.BOOLEAN,
  }, {});
  return CoronaFaqs;
};
