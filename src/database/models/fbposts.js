const {
    Model,
} = require('sequelize');

module.exports = (sequelize, DataTypes) => {
    class FbPosts extends Model {}

    FbPosts.init({
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        reference: {
            type: DataTypes.STRING,
            unique: true,
        },
        lastPostId: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'FbPosts',
    });
    return FbPosts;
};
