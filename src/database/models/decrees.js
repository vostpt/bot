module.exports = (sequelize, DataTypes) => {
  const Decrees = sequelize.define('Decrees', {
    link: DataTypes.TEXT,
    title: DataTypes.TEXT,
    description: DataTypes.TEXT,
  }, {});

  return Decrees;
};
