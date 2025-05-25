const express = require('express');
const router = express.Router();
const { getProducts, createProduct, getProductById, updateProduct, deleteProduct, getSuppliers, linkSupplier, updateSupplier, removeSupplier, getRating, adminGetSuppliers, getProductsAdmin, getTopSellingProducts, exportProducts, adminExportSuppliers, bulkRemoveSuppliers, getRecommendations } = require('../controllers/productController');
const { verifyAdmin, verifyToken } = require('../middleware/authMiddleware');

// Get products
router.get('/', getProducts)

// Get products - admin
router.get('/admin', verifyAdmin, getProductsAdmin)

// Get top-selling products
router.get('/top-picks', getTopSellingProducts)

// Get recommendations
router.get('/recommendations', verifyToken, getRecommendations)

// Get product by id
router.get('/:productId', getProductById)

// Create new product
router.post('/', verifyAdmin, createProduct)

// Export products
router.post('/admin/export-products', verifyAdmin, exportProducts)

// Edit product
router.put('/:id', verifyAdmin, updateProduct)

// Delete product
router.delete('/:id', verifyAdmin, deleteProduct)

// Get rating of a product
router.get('/:id/rating', getRating)

// Get suppliers of a product
router.get('/:id/suppliers', getSuppliers)

// Get suppliers of a product - admin
router.get('/:id/suppliers/admin', verifyAdmin, adminGetSuppliers)

// Link supplier to product
router.post('/:id/suppliers', verifyAdmin, linkSupplier)

// Update product-supplier link
router.put('/:id/suppliers', verifyAdmin, updateSupplier)

// Remove product-supplier link
router.delete('/:id/suppliers/:supplierId', verifyAdmin, removeSupplier)

// Export [product-supplier links
router.post('/:id/suppliers/export-suppliers', verifyAdmin, adminExportSuppliers)

// Bulk remove product-supplier links
router.delete('/:id/suppliers/bulk/remove', verifyAdmin, bulkRemoveSuppliers)

module.exports = router;
