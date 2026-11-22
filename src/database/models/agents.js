const {
  Model,
} = require('sequelize');

const TIMEZONE = 'Europe/Lisbon';
const KINDS = ['now', 'in', 'at', 'rrule'];
const STATUSES = ['active', 'done', 'expired'];

module.exports = (sequelize, DataTypes) => {
  class Agents extends Model {}

  Agents.init({
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    nameKey: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    guildId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    channelId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    ownerId: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    prompt: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    kind: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [KINDS],
      },
    },
    scheduleValue: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    rrule: {
      type: DataTypes.TEXT,
    },
    runAt: {
      type: DataTypes.DATE,
    },
    timezone: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: TIMEZONE,
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'active',
      validate: {
        isIn: [STATUSES],
      },
    },
    lastRunAt: {
      type: DataTypes.DATE,
    },
    nextRunAt: {
      type: DataTypes.DATE,
    },
    once: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  }, {
    sequelize,
    modelName: 'Agents',
    indexes: [
      {
        name: 'agents_guild_owner_name',
        unique: true,
        fields: ['guildId', 'ownerId', 'nameKey'],
      },
      {
        name: 'agents_guild',
        fields: ['guildId'],
      },
      {
        name: 'agents_status_next_run',
        fields: ['status', 'nextRunAt'],
      },
    ],
  });
  return Agents;
};
