const Product = require('../models/product');
const generateProductId = require('../helpers/productIdGenerator');
const mongoose = require('mongoose');
const isValidObjectId = mongoose.Types.ObjectId.isValid;
const Review = require('../models/review');
const Favorite = require('../models/favorite');
const ProductSupplier = require('../models/productSupplier');
const { getProductSuppliers, newLink, removeLink, updatePrice, updateQuantity, getProductSuppliersAdmin } = require('./productSupplierController');
const Supplier = require('../models/supplier');
const OrderProduct = require('../models/orderProduct');
const Category = require('../models/category');
const { Parser } = require('json2csv');
const Order = require('../models/order');

const getProducts = async (req, res) => {
    try {
        const { category, limit = 10, page = 1, minPrice, maxPrice, specifications } = req.query;

        const skip = (page - 1) * limit;
        const limitValue = parseInt(limit, 10);

        let query = {
            stock: { $gt: 0 }
        }

        // Filter by category if applied
        if (category) {
            const categoryData = await Category.findById(category);

            if (!categoryData) {
                return res.status(404).json({ message: 'Category not found' });
            }

            if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                query.category = { $in: categoryData.subcategories };
            } else {
                query.category = categoryData._id;
            }
        }

        // Price filtering
        if (minPrice || maxPrice) {
            query.price = {};
            if (minPrice) query.price.$gte = parseFloat(minPrice);
            if (maxPrice) query.price.$lte = parseFloat(maxPrice);
        }

        // Specification filtering
        if (specifications) {
            try {
                const parsedSpecs = JSON.parse(specifications);
                const specFilters = Object.entries(parsedSpecs).map(([key, values]) => ({
                    specifications: { $elemMatch: { name: key, value: { $in: values } } }
                }));

                if (specFilters.length > 0) {
                    query.$and = specFilters;
                }
            } catch (err) {
                return res.status(400).json({ message: 'Invalid specifications format' });
            }
        }

        const products = await Product.find(query)
            .sort({ name: 1 })
            .skip(skip)
            .limit(limitValue);


        // Get number of products
        const totalProducts = await Product.countDocuments(query);

        res.status(200).json({
            products,
            totalProducts,
            totalPages: Math.ceil(totalProducts / limit),
            currentPage: parseInt(page, 10)
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
}

// Helper function to fetch all subcategories
const getAllSubcategories = async (categoryId) => {
    const category = await Category.findById(categoryId);
    let subcategories = category.subcategories || [];

    // Recursively fetch subcategories for each child category
    for (const subcategoryId of category.subcategories) {
        const subcategory = await Category.findById(subcategoryId);
        if (subcategory) {
            if (subcategory.subcategories && subcategory.subcategories.length > 0) {
                subcategories = subcategories.concat(await getAllSubcategories(subcategoryId));
            }
        }
    }
    return subcategories;
}

const getProductsAdmin = async (req, res) => {
    try {
        const { categoryName, startDate, endDate, page = 1, limit = 10, searchQuery } = req.query;

        let query = {};

        if (categoryName) {
            const categoryData = await Category.findOne({ name: categoryName });

            if (!categoryData) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Get all subcategories recursively
            let categoryIds = [categoryData._id];
            if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                const subcategoryIds = await getAllSubcategories(categoryData._id);
                categoryIds = categoryIds.concat(subcategoryIds);
            }

            query.category = { $in: categoryIds };
        }

        // Date filtering
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Search filtering
        if (searchQuery) {
            query.$or = [
                { name: { $regex: searchQuery, $options: 'i' } },
                { productId: { $regex: searchQuery, $options: 'i' } },
                { description: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const skip = (page - 1) * limit;
        const limitValue = parseInt(limit);

        const products = await Product.find(query)
            .populate("category")
            .skip(skip)
            .limit(limitValue)
            .sort({ name: 1 });

        const totalProducts = await Product.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limitValue);

        res.status(200).json({
            products,
            totalProducts,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
}

const getTopSellingProducts = async (req, res) => {
    try {
        const { category, startDate, endDate, limit = 5 } = req.query;

        const matchConditions = [];

        // Filter by category if provided
        if (category) {
            const categoryId = new mongoose.Types.ObjectId(category);
            matchConditions.push({
                'productDetails.category': categoryId,
            });
        }

        // Filter by date range
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);

            matchConditions.push({
                'createdAt': dateFilter,
            });
        }

        const topSellingProducts = await OrderProduct.aggregate([
            {
                // Lookup to join ProductSupplier and get the associated product
                $lookup: {
                    from: 'productsuppliers',
                    localField: 'productSupplier',
                    foreignField: '_id',
                    as: 'productSupplierDetails',
                },
            },
            {
                $unwind: '$productSupplierDetails',
            },
            {
                // Lookup to join Product and get the product details
                $lookup: {
                    from: 'products',
                    localField: 'productSupplierDetails.product',
                    foreignField: '_id',
                    as: 'productDetails',
                },
            },
            {
                $unwind: '$productDetails',
            },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'categoryDetails',
                },
            },
            {
                $unwind: '$categoryDetails',
            },
            {
                // Apply match conditions dynamically
                $match: matchConditions.length ? { $and: matchConditions } : {},
            },
            {
                // Group by product ID and calculate total sales quantity
                $group: {
                    _id: '$productDetails._id',
                    productId: { $first: '$productDetails.productId' },
                    name: { $first: '$productDetails.name' },
                    description: { $first: '$productDetails.description' },
                    imageUrl: { $first: '$productDetails.imageUrl' },
                    price: { $first: '$productDetails.price' },
                    totalSales: { $sum: '$quantity' },
                    category: { $first: '$categoryDetails.name' }
                },
            },
            {
                // Sort by totalSales in descending order
                $sort: { totalSales: -1 },
            },
            {
                // Limit the results
                $limit: parseInt(limit, 10),
            }
        ]);

        res.status(200).json(topSellingProducts);
    } catch (error) {
        console.error('Error fetching top-selling products:', error);
        res.status(500).json({ message: 'Failed to fetch top-selling products.' });
    }
}

const exportProducts = async (req, res) => {
    let { productIds, exportType, searchQuery, startDate, endDate, categoryName } = req.body;

    try {
        let filters = {};

        // Handle export type
        if (exportType === 'selected' && productIds?.length) {
            filters._id = { $in: productIds };
        }

        // Apply date range filter
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) filters.createdAt.$gte = new Date(startDate);
            if (endDate) filters.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        // Apply category filter
        if (categoryName) {
            const categoryData = await Category.findOne({ name: categoryName });

            if (!categoryData) {
                return res.status(404).json({ message: 'Category not found' });
            }

            // Get all subcategories recursively
            let categoryIds = [categoryData._id];
            if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                const subcategoryIds = await getAllSubcategories(categoryData._id);
                categoryIds = categoryIds.concat(subcategoryIds);
            }

            filters.category = { $in: categoryIds };
        }

        // Apply search query filter
        if (searchQuery) {
            filters.$or = [
                { productId: { $regex: new RegExp(searchQuery, "i") } },
                { name: { $regex: new RegExp(searchQuery, "i") } }
            ];
        }

        // Fetch products with filters applied
        const products = await Product.find(filters)
            .select('productId name description category specifications price stock rating createdAt')
            .populate('category', 'name')
            .sort({ createdAt: -1 })
            .lean();

        if (!products.length) {
            return res.status(404).json({ message: "No products found." });
        }

        // Define CSV fields
        const fields = [
            { label: 'Product ID', value: 'productId' },
            { label: 'Name', value: 'name' },
            { label: 'Description', value: 'description' },
            { label: 'Category', value: row => row.category?.name || 'N/A' },
            { label: 'Specifications', value: 'specifications' },
            { label: 'Price', value: 'price' },
            { label: 'Stock', value: 'stock' },
            { label: 'Rating', value: 'rating' },
            { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(products);

        res.header('Content-Type', 'text/csv');
        res.attachment('products.csv');
        res.send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Failed to export products." });
    }
}

const addNewProduct = async (productData) => {
    const { name, description, category, imageUrl, specifications } = productData;

    let categoryDoc;
    if (isValidObjectId(category)) {
        categoryDoc = await Category.findById(category);
    } else {
        categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
        throw new Error('Category not found.');
    }

    const productId = await generateProductId(name, Product);
    const newProduct = new Product({
        productId,
        name,
        description,
        category: categoryDoc._id,
        imageUrl,
        specifications
    });

    await newProduct.save();
    return newProduct;
}

const createProduct = async (req, res) => {
    try {
        const newProduct = await addNewProduct(req.body);
        res.status(201).send({ message: 'Product added successfully.', product: newProduct })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to add new product' });
    }
}

const getProductById = async (req, res) => {
    const { productId } = req.params;

    try {
        let product;

        if (isValidObjectId(productId)) {
            product = await Product.findById(productId); // Search by MongoDB ID
        } else {
            product = await Product.findOne({ productId: productId }); // Search by custom ID
        }

        if (!product) {
            return res.status(404).send({ message: 'Product not found.' })
        }

        // Find the supplier with the lowest price for this product
        const lowestPriceSupplier = await ProductSupplier.find({ product: product._id })
            .sort({ price: 1 })
            .limit(1)
            .populate('supplier');

        res.status(200).json({
            product,
            lowestPriceSupplier: lowestPriceSupplier[0] || null,
        })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch product' });
    }
}

const updateProduct = async (req, res) => {
    const { name, description, category, imageUrl, specifications } = req.body;
    const { id } = req.params;

    let categoryDoc;
    if (isValidObjectId(category)) {
        categoryDoc = await Category.findById(category);
    } else {
        categoryDoc = await Category.findOne({ name: category });
    }

    if (!categoryDoc) {
        throw new Error('Category not found.');
    }

    try {
        const updatedProduct = await Product.findByIdAndUpdate(id, {
            id,
            name,
            description,
            category: categoryDoc._id,
            imageUrl,
            specifications
        }, { new: true });

        if (!updatedProduct) {
            res.status(404).send({ message: 'Product not found.' })
        }

        res.status(200).send({ message: 'Product updated successfully.', product: updatedProduct })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to update product' });
    }
}

const deleteProduct = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { id } = req.params;

    try {
        // Find product to be deleted
        const product = await Product.findById(id).session(session);
        if (!product) {
            return res.status(404).json({ message: "Product not found." });
        }

        // Delete the reviews and favorites associated with the product
        await Review.deleteMany({
            reviewFor: id,
            reviewForModel: "Product"
        }).session(session);
        await Favorite.deleteMany({
            favoriteId: id,
            favoriteType: "Product"
        }).session(session);

        // Find related ProductSupplier items
        const productSuppliers = await ProductSupplier.find({ product: id }).session(session);

        // Remove each link and clean up related data
        for (const supplierLink of productSuppliers) {
            await removeLink(id, supplierLink.supplier, 'product');
        }

        // Delete product
        const deletedProduct = await Product.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        res.status(200).send({ message: 'Product deleted successfully.', product: deletedProduct })
    } catch (error) {
        await session.abortTransaction();
        console.log(error.message);
        res.status(500).send({ error: 'Failed to delete product.' });
    } finally {
        session.endSession();
    }
}

const getRating = async (req, res) => {
    const { id } = req.params;

    try {
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ message: "Product not found" });
        }

        res.json({ rating: product.rating });
    } catch (error) {
        console.log("Error fetching product rating:", error.message);
        res.status(500).json({ message: "Failed to fetch product rating" });
    }
}

const getSuppliers = async (req, res) => {
    const { id } = req.params;

    try {
        let productId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        const suppliers = await getProductSuppliers(productId);

        if (!suppliers || suppliers.length === 0) {
            return res.status(204).json({ message: 'No suppliers found for this product.' });
        }

        res.status(200).json(suppliers);
    } catch (error) {
        console.log('Error fetching suppliers for product:', error.message);
        res.status(500).json({ message: 'Failed to fetch suppliers.' });
    }
}

const linkSupplier = async (req, res) => {
    const { id } = req.params;
    const { supplierId, quantity, price } = req.body;

    if (!id || !supplierId || !price || !quantity) {
        return res.status(400).json({ error: "Product ID, Supplier ID, price, and quantity are required" });
    }

    try {
        let productId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        // Find the supplier with provided id
        const supplier = await Supplier.findOne({ supplierId: supplierId })

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        // Create link between product and supplier
        const result = await newLink(productId, supplier._id, price, quantity);
        res.status(200).json({ message: 'Supplier linked to product successfully.', connection: result });
    } catch (error) {
        console.log('Error linking supplier to product:', error.message);
        res.status(500).json({ message: 'Failed to link supplier to product.' });
    }
}

const updateSupplier = async (req, res) => {
    const { id } = req.params;
    const { supplierId, quantity, price } = req.body;

    if (!id || !supplierId || (quantity === undefined && price === undefined)) {
        return res.status(400).json({ error: "Product ID, Supplier ID, price or quantity are required" });
    }

    try {
        let productId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        // Find the supplier with provided id
        const supplier = await Supplier.findOne({ supplierId: supplierId })

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        if (price !== undefined) {
            await updatePrice(productId, supplier._id, price);
        }

        if (quantity !== undefined) {
            await updateQuantity(productId, supplier._id, quantity);
        }

        // Update product-supplier link
        updatedConnection = await ProductSupplier.findOne({ product: productId, supplier: supplier._id });

        res.status(200).json({ message: 'Supplier link updated successfully.', connection: updatedConnection });
    } catch (error) {
        console.log('Error linking supplier to product:', error.message);
        res.status(500).json({ message: 'Failed to link supplier to product.' });
    }
}

const removeSupplier = async (req, res) => {
    const { id, supplierId } = req.params;

    if (!id || !supplierId) {
        return res.status(400).json({ error: "Product ID and Supplier ID are required" });
    }

    try {
        let productId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        // Find the supplier with provided id
        const supplier = await Supplier.findOne({ supplierId: supplierId })

        if (!supplier) {
            return res.status(404).json({ message: 'Supplier not found.' });
        }

        // Remove product-supplier link
        const result = await removeLink(productId, supplier._id);

        res.status(200).json({ message: 'Supplier removed successfully.', connection: result });
    } catch (error) {
        console.log('Error removing supplier from product:', error.message);
        res.status(500).json({ message: 'Failed to remove supplier from product.' });
    }
}

const adminGetSuppliers = async (req, res) => {
    const { id } = req.params;
    const { limit = 15, page = 1, sort = 'price', searchQuery } = req.query;

    try {
        let productId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        // Get all suppliers of a product
        const { suppliers, totalSuppliers } = await getProductSuppliersAdmin(productId, { limit, page, sort, searchQuery });

        if (!suppliers || suppliers.length === 0) {
            return res.status(204).json({ message: 'No suppliers found for this product.' });
        }

        res.status(200).json({
            suppliers,
            totalSuppliers,
            totalPages: Math.ceil(totalSuppliers / limit),
            currentPage: parseInt(page, 15),
        });
    } catch (error) {
        console.log('Error fetching suppliers for product:', error.message);
        res.status(500).json({ message: 'Failed to fetch suppliers.' });
    }
}

const adminExportSuppliers = async (req, res) => {
    const { id } = req.params;
    const { exportType, supplierIds, searchQuery } = req.body;

    try {
        let productId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        const { suppliers } = await getProductSuppliersAdmin(productId, {
            limit: null,
            page: 1,
            sort: 'price',
            searchQuery
        });

        if (!suppliers || suppliers.length === 0) {
            return res.status(204).json({ message: 'No suppliers found.' });
        }

        // Filter if only selected suppliers should be exported
        let filteredSuppliers = suppliers;
        if (exportType === 'selected' && supplierIds?.length) {
            filteredSuppliers = suppliers.filter(supplier =>
                supplierIds.includes(supplier.supplierDetails._id.toString())
            );
        }

        if (!filteredSuppliers.length) {
            return res.status(204).json({ message: 'No matching suppliers found.' });
        }

        // Transform data for CSV export
        const csvData = filteredSuppliers.map(supplier => ({
            _id: supplier.supplierDetails._id,
            supplierId: supplier.supplierDetails.supplierId,
            supplierName: supplier.supplierDetails.name,
            contactEmail: supplier.supplierDetails.contact?.email || 'N/A',
            contactAddress: supplier.supplierDetails.contact?.address || 'N/A',
            contactPhone: supplier.supplierDetails.contact?.phone || 'N/A',
            vatNumber: supplier.supplierDetails.vatNumber,
            price: supplier.price,
            quantity: supplier.quantity
        }));

        // Define CSV fields
        const fields = ['supplierId', 'supplierName', 'contactAddress', 'contactEmail', 'contactPhone', 'vatNumber', 'price', 'quantity'];
        const parser = new Parser({ fields });
        const csv = parser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=suppliers.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.error('Error exporting suppliers:', error.message);
        res.status(500).json({ message: 'Failed to export suppliers.' });
    }
}

const deleteProducts = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    const { productIds } = req.body;

    try {
        if (!productIds || !productIds.length) {
            return res.status(400).json({ message: "No product IDs provided." });
        }

        // Find all products to be deleted
        const products = await Product.find({ _id: { $in: productIds } }).session(session);
        if (!products.length) {
            return res.status(404).json({ message: "No products found." });
        }

        // Delete associated reviews and favorites for all products
        await Review.deleteMany({
            reviewFor: { $in: productIds },
            reviewForModel: "Product"
        }).session(session);

        await Favorite.deleteMany({
            favoriteId: { $in: productIds },
            favoriteType: "Product"
        }).session(session);

        // Find related ProductSupplier entries
        const productSuppliers = await ProductSupplier.find({ product: { $in: productIds } }).session(session);

        // Remove each link and clean up related data
        for (const productLink of productSuppliers) {
            await removeLink(productLink.product, productLink.supplier, 'product');
        }

        // Delete products
        const deletedProducts = await Product.deleteMany({ _id: { $in: productIds } }).session(session);

        await session.commitTransaction();
        res.status(200).json({ message: 'Products deleted successfully.', deletedCount: deletedProducts.deletedCount });

    } catch (error) {
        await session.abortTransaction();
        console.error(error.message);
        res.status(500).json({ error: 'Failed to delete products.' });
    } finally {
        session.endSession();
    }
}

const bulkRemoveSuppliers = async (req, res) => {
    const { id } = req.params;
    const { supplierIds } = req.body;

    if (!id || !Array.isArray(supplierIds) || supplierIds.length === 0) {
        return res.status(400).json({ error: "Product ID and a valid array of Supplier IDs are required" });
    }

    try {
        let productId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            productId = id;
        } else {
            const product = await Product.findOne({ productId: id });
            if (!product) {
                return res.status(404).json({ message: 'Product not found.' });
            }
            productId = product._id.toHexString();
        }

        // Find the supplier IDs in the database
        const suppliers = await Supplier.find({ _id: { $in: supplierIds } });

        if (!suppliers || suppliers.length === 0) {
            return res.status(404).json({ message: 'No matching suppliers found.' });
        }

        // Extract valid supplier IDs
        const supplierObjectIds = suppliers.map(supplier => supplier._id);

        // Remove links for each supplier
        const removalResults = await Promise.all(
            supplierObjectIds.map(supplierId => removeLink(productId, supplierId))
        );

        res.status(200).json({
            message: 'Suppliers removed successfully.',
            removedConnections: removalResults
        });
    } catch (error) {
        console.log('Error removing suppliers from product:', error.message);
        res.status(500).json({ message: 'Failed to remove suppliers from product.' });
    }
}

// Function to find categories that don't have subcategories, only products
async function findLeafCategories(categoryIds) {
    const leaves = new Set();

    async function dfs(categoryId) {
        const children = await Category.find({ parent: categoryId });

        if (children.length === 0) {
            leaves.add(categoryId.toString());
        } else {
            for (const child of children) {
                await dfs(child._id);
            }
        }
    }

    for (const id of categoryIds) {
        await dfs(id);
    }

    return Array.from(leaves);
}

// Get product recommendations depending on user's orders and similar users' orders
const getRecommendations = async (req, res) => {
    const userId = req.user.id;

    try {
        const userOrders = await Order.find({ user: userId })
            .populate({
                path: 'groupedProducts.products',
                populate: {
                    path: 'productSupplier',
                    populate: {
                        path: 'product',
                        populate: {
                            path: 'category',
                            populate: { path: 'parent' }
                        }
                    }
                }
            });

        const userProductIds = new Set();
        const userCategoryIds = new Set();
        const userParentCategoryIds = new Set();

        // Find all user's orders and check the categories he likes to buy from
        for (const order of userOrders) {
            for (const group of order.groupedProducts) {
                for (const orderProduct of group.products) {
                    const productSupplier = orderProduct.productSupplier;
                    if (productSupplier?.product) {
                        const product = productSupplier.product;
                        userProductIds.add(product._id.toString());

                        const category = product.category;
                        if (category) {
                            userCategoryIds.add(category._id.toString());
                            if (category.parent) {
                                userParentCategoryIds.add(category.parent._id.toString());
                            }
                        }
                    }
                }
            }
        }

        const allInterestedCategoryIds = new Set([...userCategoryIds, ...userParentCategoryIds]);
        const leafCategoryIds = await findLeafCategories(allInterestedCategoryIds);

        // Find products from these categories that user hasn't bought already
        const categoryBasedProducts = await Product.find({
            $and: [
                { _id: { $nin: Array.from(userProductIds) } },
                { category: { $in: leafCategoryIds } }
            ]
        }).limit(10);

        const similarOrders = await Order.find({
            user: { $ne: userId },
            'groupedProducts.products': { $exists: true }
        }).populate({
            path: 'groupedProducts.products',
            populate: {
                path: 'productSupplier',
                populate: {
                    path: 'product',
                    populate: {
                        path: 'category',
                        populate: { path: 'parent' }
                    }
                }
            }
        });

        const collaborativeRecommendations = new Set();

        // Find orders that include products the user has bought
        for (const order of similarOrders) {
            for (const group of order.groupedProducts) {
                for (const orderProduct of group.products) {
                    const product = orderProduct?.productSupplier?.product;
                    if (!product) continue;

                    const productIdStr = product._id.toString();

                    // If user hasn't bought a product from these orders, add it to the list of recommendations
                    if (!userProductIds.has(productIdStr)) {
                        collaborativeRecommendations.add(productIdStr);
                    }
                }
            }
        }

        const collaborativeProducts = await Product.find({
            _id: { $in: Array.from(collaborativeRecommendations) }
        }).limit(10);

        const allProducts = [
            ...categoryBasedProducts,
            ...collaborativeProducts
        ];

        // Remove duplicates
        const uniqueProductsMap = new Map();
        for (const product of allProducts) {
            uniqueProductsMap.set(product._id.toString(), product);
        }

        const finalRecommendations = Array.from(uniqueProductsMap.values());

        res.status(200).json({ recommendations: finalRecommendations });
    } catch (error) {
        console.error('Error fetching recommended products:', error);
        res.status(500).json({ message: 'Failed to fetch recommended products.' });
    }
}

module.exports = {
    getProducts,
    getProductsAdmin,
    getTopSellingProducts,
    addNewProduct,
    createProduct,
    getProductById,
    updateProduct,
    deleteProduct,
    getRating,
    getSuppliers,
    linkSupplier,
    updateSupplier,
    removeSupplier,
    adminGetSuppliers,
    deleteProducts,
    exportProducts,
    adminExportSuppliers,
    bulkRemoveSuppliers,
    getRecommendations
}