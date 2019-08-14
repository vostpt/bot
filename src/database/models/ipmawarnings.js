module.exports = (sequelize, DataTypes) => {
  const IpmaWarnings = sequelize.define('IpmaWarnings', {
    uuid: DataTypes.STRING,
    description: DataTypes.STRING,
    awareness_type: DataTypes.STRING,
    awareness_level: DataTypes.STRING,
    started_at: DataTypes.STRING,
    ended_at: DataTypes.STRING,
    district: DataTypes.STRING,
  }, {});
  IpmaWarnings.associate = (models) => {
    // associations can be defined here
  };
  return IpmaWarnings;
};
