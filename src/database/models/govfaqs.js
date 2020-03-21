module.exports = (sequelize, DataTypes) => {
  const GovFaqs = sequelize.define('GovFaqs', {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    area: DataTypes.STRING,
    question: DataTypes.STRING,
    answer: DataTypes.STRING,
    entity: DataTypes.STRING,
    onsite: DataTypes.STRING,
  }, {});
  return GovFaqs;
};
