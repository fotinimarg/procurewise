const express = require('express');
const router = express.Router();
const { getSuppliers, createSupplier, getSupplierById, deleteSupplier, updateSupplier, getProducts, linkProduct, updateProduct, removeProduct, getRating, adminGetProducts, deleteSuppliers, exportSuppliers, bulkRemoveProducts, adminExportProducts, getTopSuppliers, getNewSuppliers } = require('../controllers/supplierController');
const { verifyAdmin } = require('../middleware/authMiddleware')

// Get all suppliers
router.get('/', getSuppliers)

// Get top suppliers
router.get('/admin/top', getTopSuppliers)

// Get new suppliers - admin
router.get('/admin/new-suppliers', verifyAdmin, getNewSuppliers)

// Get supplier by id
router.get('/:supplierId', getSupplierById)

// Create new supplier
router.post('/', verifyAdmin, createSupplier)

// Export suppliers
router.post('/admin/export-suppliers', verifyAdmin, exportSuppliers)

// Edit supplier
router.put('/:id', verifyAdmin, updateSupplier)

// Delete supplier
router.delete('/:id', verifyAdmin, deleteSupplier)

// Bulk delete suppliers
router.delete('/admin/bulk-delete', verifyAdmin, deleteSuppliers)

// Get rating of a supplier
router.get('/:id/rating', getRating)

// Get products of a supplier
router.get('/:id/products', getProducts)

// Get products of a supplier - admin
router.get('/:id/products/admin', verifyAdmin, adminGetProducts)

// Link product to a supplier
router.post('/:id/products', verifyAdmin, linkProduct)

// Update supplier-product link
router.put('/:id/products', verifyAdmin, updateProduct)

// Remove supplier-product link
router.delete('/:id/products/:productId', verifyAdmin, removeProduct)

// Bulk remove supplier-product links
router.delete('/:id/products/bulk/remove', verifyAdmin, bulkRemoveProducts)

// Export supplier-product links
router.post('/:id/products/export', verifyAdmin, adminExportProducts)

module.exports = router;