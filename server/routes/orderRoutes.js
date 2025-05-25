const express = require('express');
const router = express.Router();
const { getOrders, ordersCount, getOrderById, applyCoupon, validateCoupon, addShipping, addPayment, checkout, addContact, reorder, getCompletedOrders, getNonCompletedOrders, statusChange, flagOrder, addNotes, sendToSuppliers, bulkUpdateStatus, exportOrders, sharedStatus, getStats, addVatNumber } = require('../controllers/orderController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware');
const { ensureCartNotEmpty } = require('../helpers/orderValidation');

// Get user's orders
router.get('/user', verifyToken, getOrders)

// Get completed orders - admin
router.get('/admin/completed', verifyAdmin, getCompletedOrders)

// Get non-completed orders - admin
router.get('/admin/non-completed', verifyAdmin, getNonCompletedOrders)

// Bulk update orders' status
router.put('/admin/bulk-update', verifyAdmin, bulkUpdateStatus)

// Export orders
router.post('/admin/export', verifyAdmin, exportOrders)

// Get order stats
router.get('/admin/stats', verifyAdmin, getStats)

// Get number of user's orders
router.get('/count', verifyToken, ordersCount)

// Validate coupon
router.get('/validate-coupon', verifyToken, ensureCartNotEmpty, validateCoupon)

// Get order by id
router.get('/:orderId', verifyToken, getOrderById)

// Apply coupon to order
router.post('/apply-coupon', verifyToken, ensureCartNotEmpty, applyCoupon)

// Add shipping method & cost
router.put('/shipping', verifyToken, ensureCartNotEmpty, addShipping)

// Add contact number
router.put('/contact', verifyToken, ensureCartNotEmpty, addContact)

// Add payment method
router.put('/payment', verifyToken, ensureCartNotEmpty, addPayment)

// Add VAT number
router.put('/vat-number', verifyToken, ensureCartNotEmpty, addVatNumber)

// Checkout
router.post('/place', verifyToken, ensureCartNotEmpty, checkout)

// Reorder
router.post('/reorder/:orderId', verifyToken, reorder)

// Change order's status
router.put('/admin/status/:orderId', verifyAdmin, statusChange)

// Flag order
router.patch('/:orderId/admin/flag', verifyAdmin, flagOrder)

// Add notes
router.patch('/:orderId/admin/notes', verifyAdmin, addNotes)

// Send order to suppliers
router.post('/share-to-suppliers', verifyAdmin, sendToSuppliers)

// Get shared-with-suppliers status
router.get('/shared-status/:orderId', verifyAdmin, sharedStatus)

module.exports = router;