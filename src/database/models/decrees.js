const {
  Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Decrees extends Model {}

  Decrees.init({
    link: DataTypes.TEXT,
    title: DataTypes.TEXT,
    description: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'Decrees',
  });
  return Decrees;
};
