const { Sequelize, DataTypes } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
});

const Board = require('./Board')(sequelize, DataTypes);
const User = require('./User')(sequelize, DataTypes);
const Column = require('./Column')(sequelize, DataTypes);
const Comment = require('./Comment')(sequelize, DataTypes);

// İlişkiler
Board.hasMany(Column, { foreignKey: 'boardId', onDelete: 'CASCADE' });
Column.belongsTo(Board, { foreignKey: 'boardId' });

Column.hasMany(Comment, { foreignKey: 'columnId', onDelete: 'CASCADE' });
Comment.belongsTo(Column, { foreignKey: 'columnId' });

Board.hasMany(User, { foreignKey: 'boardId', onDelete: 'CASCADE' });
User.belongsTo(Board, { foreignKey: 'boardId' });

// Board modeline timer alanı ekle

module.exports = {
  sequelize,
  Board,
  User,
  Column,
  Comment,
}; 