const express = require('express');
const router = express.Router();
const { getReviewsByType, addReviewByType, getUserReviews, deleteReview } = require('../controllers/reviewController');
const { verifyToken } = require('../middleware/authMiddleware')

// Get reviews for a product or a supplier
router.get('/', getReviewsByType)

// Post a review for a product or a supplier
router.post('/', verifyToken, addReviewByType)

// Get reviews made by user
router.get('/user/:userId', verifyToken, getUserReviews)

// Delete product or supplier review
router.delete('/:reviewId', verifyToken, deleteReview)

module.exports = router;