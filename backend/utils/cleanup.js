const models = require('../models');
const { Op } = require('sequelize');

// Veritabanında 3 saatten eski boardları ve ilişkili verileri silen temizlik fonksiyonu
const cleanupOldBoards = async () => {
  const THREE_HOURS = 3 * 60 * 60 * 1000;
  const now = Date.now();
  try {
    // 3 saatten eski boardları bul
    const oldBoards = await models.Board.findAll({
      where: {
        createdAt: { [Op.lt]: new Date(now - THREE_HOURS) }
      }
    });
    for (const board of oldBoards) {
      const boardId = board.id;
      await models.Comment.destroy({ where: { boardId } });
      await models.Column.destroy({ where: { boardId } });
      await models.User.destroy({ where: { boardId } });
      await models.Board.destroy({ where: { id: boardId } });
    }
  } catch (err) {
    console.error('cleanupOldBoards error:', err);
  }
};

module.exports = {
  cleanupOldBoards
}; 