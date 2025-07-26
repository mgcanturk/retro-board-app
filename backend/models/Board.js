module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define('Board', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    isLocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    showNames: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    inviteCode: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    timer: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    commentSortOrder: {
      type: DataTypes.ENUM('chronological', 'reverse-chronological', 'by-author'),
      defaultValue: 'chronological',
    },
  });
  return Board;
}; 