module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define('Comment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    text: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    author: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    likes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    dislikes: {
      type: DataTypes.JSONB,
      defaultValue: [],
    },
    boardId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    columnId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  });
  return Comment;
}; 