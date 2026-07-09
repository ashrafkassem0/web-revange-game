const { Router } = require('express');
const { authMiddleware, optionalAuth } = require('../middleware/auth');
const GameController = require('../controllers/game.controller');

const router = Router();

// Game Save Slots
router.get('/saves', authMiddleware, GameController.listSaves);
router.get('/saves/:slot', authMiddleware, GameController.getSave);
router.post('/saves/:slot', authMiddleware, GameController.saveGame);
router.delete('/saves/:slot', authMiddleware, GameController.deleteSave);

// Bulk Sync
router.post('/sync', authMiddleware, GameController.sync);

// Leaderboard (public + authed)
router.get('/leaderboard', optionalAuth, GameController.getLeaderboard);
router.get('/leaderboard/me', authMiddleware, GameController.getMyRank);
router.post('/leaderboard/submit', authMiddleware, GameController.submitScore);

// Player Profile
router.get('/players/:id/profile', optionalAuth, GameController.getPlayerProfile);

module.exports = router;
