const express = require('express');
const router = express.Router();
const { getUserFavorites, addFavoriteByType, checkFavorite, deleteFavorite } = require('../controllers/favoriteController');
const { verifyToken } = require('../middleware/authMiddleware')

// Get user's favorites
router.get('/user/:userId', verifyToken, getUserFavorites);

// Add new favorite
router.post('/new', verifyToken, addFavoriteByType);

// Check if it's favorited already
router.get('/check/:type/:typeId', verifyToken, checkFavorite)

// Delete from favorites
router.delete('/:type/:typeId', verifyToken, deleteFavorite);

module.exports = router;
