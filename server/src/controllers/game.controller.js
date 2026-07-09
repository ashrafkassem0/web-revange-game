const GameService = require('../services/game.service');
const LeaderboardService = require('../services/leaderboard.service');

const GameController = {
  // ==== Save Slots ====
  listSaves(req, res) {
    try {
      const saves = GameService.listSaves(req.user.sub);
      res.json({ saves });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في تحميل قائمة الحفظ' });
    }
  },

  getSave(req, res) {
    try {
      const slot = parseInt(req.params.slot, 10);
      if (isNaN(slot) || slot < 1 || slot > 10) {
        return res.status(400).json({ error: 'رقم الحفظ غير صالح' });
      }
      const save = GameService.getSave(req.user.sub, slot);
      if (!save) return res.status(404).json({ error: 'لم يتم العثور على الحفظ' });
      res.json({ save });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في تحميل الحفظ' });
    }
  },

  saveGame(req, res) {
    try {
      const slot = parseInt(req.params.slot, 10);
      if (isNaN(slot) || slot < 1 || slot > 10) {
        return res.status(400).json({ error: 'رقم الحفظ غير صالح' });
      }

      const result = GameService.saveGame(req.user.sub, slot, req.body);
      if (result.conflict) {
        return res.status(409).json({
          error: 'توجد نسخة أحدث على الخادم',
          save: result.serverSave,
        });
      }

      res.json({ save: result.save });
    } catch (e) {
      res.status(e.status || 500).json({ error: e.message || 'خطأ في الحفظ' });
    }
  },

  deleteSave(req, res) {
    try {
      const slot = parseInt(req.params.slot, 10);
      if (isNaN(slot) || slot < 1 || slot > 10) {
        return res.status(400).json({ error: 'رقم الحفظ غير صالح' });
      }
      const result = GameService.deleteSave(req.user.sub, slot);
      res.json(result);
    } catch (e) {
      res.status(e.status || 404).json({ error: e.message || 'خطأ في الحذف' });
    }
  },

  // ==== Bulk Sync ====
  sync(req, res) {
    try {
      const { saves } = req.body;
      if (!Array.isArray(saves)) {
        return res.status(400).json({ error: 'بيانات غير صالحة' });
      }
      const result = GameService.bulkSync(req.user.sub, saves);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'خطأ في المزامنة' });
    }
  },

  // ==== Leaderboard ====
  getLeaderboard(req, res) {
    try {
      const limit = parseInt(req.query.limit, 10) || 20;
      const offset = parseInt(req.query.offset, 10) || 0;
      const entries = LeaderboardService.getLeaderboard(limit, offset);
      res.json({ entries });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في تحميل لوحة المتصدرين' });
    }
  },

  getMyRank(req, res) {
    try {
      const result = LeaderboardService.getMyRank(req.user.sub);
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: 'خطأ في تحميل الترتيب' });
    }
  },

  getPlayerProfile(req, res) {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'معرف لاعب غير صالح' });
      const profile = LeaderboardService.getPlayerProfile(id);
      if (!profile) return res.status(404).json({ error: 'اللاعب غير موجود' });
      res.json({ profile });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في تحميل الملف الشخصي' });
    }
  },

  submitScore(req, res) {
    try {
      const { score, level, enemiesKilled, playTime } = req.body;
      if (typeof score !== 'number') {
        return res.status(400).json({ error: 'النتيجة مطلوبة' });
      }
      LeaderboardService.submitScore(req.user.sub, req.user.username, score, level || 1, enemiesKilled || 0, playTime || 0);
      res.json({ success: true });
    } catch (e) {
      res.status(500).json({ error: 'خطأ في إرسال النتيجة' });
    }
  },
};

module.exports = GameController;
