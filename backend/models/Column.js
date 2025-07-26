module.exports = (sequelize, DataTypes) => {
  const Column = sequelize.define('Column', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    adminOnly: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    order: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    boardId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });
  return Column;
}; 