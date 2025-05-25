const express = require('express');
const router = express.Router();
const { getCategory, getCategories, deleteCategory, editCategory, createCategory, getCategoryBySlug, getProducts, getCategoriesWithHierarchy, getCategorySpecifications } = require('../controllers/categoryController');
const { verifyAdmin } = require('../middleware/authMiddleware');

// Get general categories
router.get('/', getCategories);

// Route to create a general category
router.post('/', verifyAdmin, createCategory);

// Get category + subcategories using id
router.get('/:categoryId', getCategory);

// Get category + subcategories using slug
router.get('/category/slug', getCategoryBySlug);

// Get products of category
router.get('/:categoryId/products', getProducts);

// Delete a category
router.delete('/:categoryId', verifyAdmin, deleteCategory);

// Edit a category's name
router.put('/:categoryId', verifyAdmin, editCategory);

// Get categories with hierarchy
router.get('/get/hierarchy', getCategoriesWithHierarchy);

// Get category's specifications
router.get('/:categoryId/specifications', getCategorySpecifications);

module.exports = router;
