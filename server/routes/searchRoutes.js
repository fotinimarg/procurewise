const express = require('express');
const router = express.Router();
const Product = require('../models/product');
const Supplier = require('../models/supplier');

// Get search results
router.get('/', async (req, res) => {
    const searchQuery = req.query.q;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    try {
        // Find total counts for pagination
        const [totalProducts, totalSuppliers] = await Promise.all([
            Product.countDocuments({
                $and: [
                    {
                        $or: [
                            { name: { $regex: searchQuery, $options: 'i' } },
                            { productId: { $regex: `^${searchQuery}$`, $options: 'i' } },
                            { description: { $regex: searchQuery, $options: 'i' } }
                        ]
                    },
                    { stock: { $gt: 0 } }
                ]
            }),
            Supplier.countDocuments({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { supplierId: { $regex: `^${searchQuery}$`, $options: 'i' } }
                ]
            })
        ]);

        // Find products and suppliers matching the search query
        const [products, suppliers] = await Promise.all([
            Product.find({
                $and: [
                    {
                        $or: [
                            { name: { $regex: searchQuery, $options: 'i' } },
                            { productId: { $regex: `^${searchQuery}$`, $options: 'i' } },
                            { description: { $regex: searchQuery, $options: 'i' } }
                        ]
                    },
                    { stock: { $gt: 0 } }
                ]
            })
                .skip(skip)
                .limit(limit),

            Supplier.find({
                $or: [
                    { name: { $regex: searchQuery, $options: 'i' } },
                    { supplierId: { $regex: `^${searchQuery}$`, $options: 'i' } }
                ]
            })
                .skip(skip)
                .limit(limit)
        ]);

        res.json({
            products,
            suppliers,
            totalPages: {
                products: Math.ceil(totalProducts / limit),
                suppliers: Math.ceil(totalSuppliers / limit)
            },
            currentPage: page
        });
    } catch (error) {
        console.log("Error during search:", error.message);
        res.status(500).json({ message: "Error fetching search results." });
    }
})

module.exports = router;