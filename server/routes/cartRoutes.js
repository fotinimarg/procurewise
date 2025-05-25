const express = require('express');
const router = express.Router();
const { getCart, addToCart, updateOrderProduct, removeFromCart } = require('../controllers/cartController');
const { verifyUserOrGuest, assignGuestId } = require('../middleware/authMiddleware');

// Get user's cart
router.get('/', assignGuestId, verifyUserOrGuest, getCart)

// Add new product to cart
router.post('/', assignGuestId, verifyUserOrGuest, addToCart)

// Update the details of a product in the cart
router.put('/:orderProductId', verifyUserOrGuest, updateOrderProduct)

// Remove a product from cart
router.delete('/:orderProductId', verifyUserOrGuest, removeFromCart)

module.exports = router;