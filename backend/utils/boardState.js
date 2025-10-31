const models = require('../models');

async function getFullBoardState(boardId) {
  // Doğrudan DB'den çek
  const board = await models.Board.findByPk(boardId, {
    include: [
      {
        model: models.Column,
        include: [models.Comment],
        order: [['order', 'ASC']],
      },
      {
        model: models.User,
        attributes: ['id', 'nickname', 'isAdmin', 'joinedAt', 'socketId'],
      },
    ],
    order: [[models.Column, 'order', 'ASC']],
  });
  if (!board) return null;
  const plain = board.get({ plain: true });
  const result = {
    ...plain,
    columns: (plain.Columns || []).map(col => ({
      ...col,
      comments: (col.Comments || []).sort((a, b) => {
        switch (plain.commentSortOrder) {
          case 'reverse-chronological':
            return new Date(b.timestamp) - new Date(a.timestamp);
          case 'by-author':
            // Önce yazara göre sırala, sonra aynı yazarın yorumlarını kronolojik sırala
            if (a.author !== b.author) {
              return a.author.localeCompare(b.author);
            }
            return new Date(a.timestamp) - new Date(b.timestamp);
          case 'chronological':
          default:
            return new Date(a.timestamp) - new Date(b.timestamp);
        }
      }),
    })),
    participants: plain.Users || [],
  };
  return result;
}

module.exports = {
  getFullBoardState
}; 