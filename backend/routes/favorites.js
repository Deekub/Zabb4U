const express = require('express');
const router = express.Router();
const favoritesController = require('../controllers/favoritesController');
const { authenticate, isAdmin } = require('../middleware/auth');

router.get('/', authenticate, favoritesController.getFavorites);
router.post('/add', authenticate, favoritesController.addFavorite);
router.delete('/remove/:id', authenticate, favoritesController.removeFavorite); // ใช้ :id สำหรับการลบจาก URL

module.exports = router;
