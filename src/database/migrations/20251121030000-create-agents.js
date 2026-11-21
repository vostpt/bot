module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Agents', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
      },
      name: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      nameKey: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      guildId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      channelId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      ownerId: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      prompt: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      kind: {
        allowNull: false,
        type: Sequelize.STRING,
      },
      scheduleValue: {
        allowNull: false,
        type: Sequelize.TEXT,
      },
      rrule: {
        type: Sequelize.TEXT,
      },
      runAt: {
        type: Sequelize.DATE,
      },
      timezone: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'Europe/Lisbon',
      },
      status: {
        allowNull: false,
        type: Sequelize.STRING,
        defaultValue: 'active',
      },
      lastRunAt: {
        type: Sequelize.DATE,
      },
      nextRunAt: {
        type: Sequelize.DATE,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });

    await queryInterface.addIndex('Agents', ['guildId', 'ownerId', 'nameKey'], {
      name: 'agents_guild_owner_name',
      unique: true,
    });
    await queryInterface.addIndex('Agents', ['guildId'], {
      name: 'agents_guild',
    });
    await queryInterface.addIndex('Agents', ['status', 'nextRunAt'], {
      name: 'agents_status_next_run',
    });
  },
  down: async (queryInterface) => {
    await queryInterface.removeIndex('Agents', 'agents_guild_owner_name');
    await queryInterface.removeIndex('Agents', 'agents_guild');
    await queryInterface.removeIndex('Agents', 'agents_status_next_run');
    await queryInterface.dropTable('Agents');
  },
};
