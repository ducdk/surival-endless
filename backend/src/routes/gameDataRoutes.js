const express = require('express');
const gameDataController = require('../controllers/gameDataController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authMiddleware.protect); // Protect all routes below

router.get('/', gameDataController.getGameData);
router.put('/', gameDataController.updateGameData);

module.exports = router;
