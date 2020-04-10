module.exports = (sequelize, DataTypes) => {
  const Earthquakes = sequelize.define('Earthquakes', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    time: DataTypes.DATE,
    dataUpdate: DataTypes.DATE,
    zone: DataTypes.INTEGER,
    degree: DataTypes.STRING,
    magType: DataTypes.STRING,
    magnitud: DataTypes.STRING,
    depth: DataTypes.INTEGER,
    obsRegion: DataTypes.STRING,
    local: DataTypes.STRING,
    lat: DataTypes.STRING,
    lon: DataTypes.STRING,
    sensed: DataTypes.STRING,
    shakemapid: DataTypes.STRING,
    shakemapref: DataTypes.STRING,
  }, {});
  return Earthquakes;
};
