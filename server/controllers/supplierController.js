const Supplier = require('../models/supplier');
const generateSupplierId = require('../helpers/supplierIdGenerator');
const mongoose = require('mongoose');
const isValidObjectId = mongoose.Types.ObjectId.isValid;
const Review = require('../models/review');
const Favorite = require('../models/favorite');
const ProductSupplier = require('../models/productSupplier');
const { getSupplierProducts, newLink, removeLink, updatePrice, updateQuantity, getSupplierProductsAdmin } = require('./productSupplierController');
const { Parser } = require('json2csv');
const Product = require('../models/product');
const OrderProduct = require('../models/orderProduct');

const getSuppliers = async (req, res) => {
    try {
        const { limit = 10, page = 1, sort = 'rating', startDate, endDate, searchQuery } = req.query;

        let query = {};

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
                { supplierId: { $regex: searchQuery, $options: 'i' } },
                { vatNumber: { $regex: searchQuery, $options: 'i' } },
                { 'contact.address': { $regex: searchQuery, $options: 'i' } }
            ];
        }

        const limitValue = parseInt(limit, 10);
        const skip = (page - 1) * limitValue;

        const suppliers = await Supplier.find(query)
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(limitValue)
            .lean();

        const totalSuppliers = await Supplier.countDocuments(query);
        const totalPages = Math.ceil(totalSuppliers / limitValue);

        res.status(200).json({
            suppliers,
            totalPages,
            currentPage: page,
            totalSuppliers
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch suppliers' });
    }
}

const exportSuppliers = async (req, res) => {
    let { supplierIds, exportType, searchQuery, startDate, endDate } = req.body;

    try {
        let filters = {};

        // Handle export type
        if (exportType === 'selected' && supplierIds?.length) {
            filters._id = { $in: supplierIds };
        }

        // Apply date range filter
        if (startDate || endDate) {
            filters.createdAt = {};
            if (startDate) filters.createdAt.$gte = new Date(startDate);
            if (endDate) filters.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
        }

        // Apply search query filter
        if (searchQuery) {
            filters.$or = [
                { supplierId: { $regex: new RegExp(searchQuery, "i") } },
                { name: { $regex: new RegExp(searchQuery, "i") } },
                { "contact.email": { $regex: new RegExp(searchQuery, "i") } },
                { "contact.phone": { $regex: new RegExp(searchQuery, "i") } },
                { "contact.address": { $regex: new RegExp(searchQuery, "i") } }
            ];
        }

        // Fetch suppliers with filters applied
        const suppliers = await Supplier.find(filters)
            .select('supplierId name contact link rating createdAt')
            .sort({ createdAt: -1 })
            .lean();

        if (!suppliers.length) {
            return res.status(404).json({ message: "No suppliers found." });
        }

        // Define CSV fields
        const fields = [
            { label: 'Supplier ID', value: 'supplierId' },
            { label: 'Name', value: 'name' },
            { label: 'Email', value: row => row.contact?.email || 'N/A' },
            { label: 'Phone', value: row => row.contact?.phone || 'N/A' },
            { label: 'Address', value: row => row.contact?.address || 'N/A' },
            { label: 'Website Link', value: 'link' },
            { label: 'Rating', value: 'rating' },
            { label: 'Created At', value: row => new Date(row.createdAt).toLocaleString() }
            //{ label: 'VAT Number', value: 'vatNumber' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(suppliers);

        res.header('Content-Type', 'text/csv');
        res.attachment('suppliers.csv');
        res.send(csv);
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: "Failed to export suppliers" });
    }
}

const addNewSupplier = async (supplierData) => {
    const { name, contact, vatNumber, link, logo } = supplierData;
    const supplierId = await generateSupplierId(name, Supplier);
    const newSupplier = new Supplier({
        supplierId,
        name,
        contact,
        vatNumber,
        link,
        logo,
    });

    await newSupplier.save();
    return newSupplier;
}

const createSupplier = async (req, res) => {
    try {
        const newSupplier = await addNewSupplier(req.body);
        res.status(201).send({ message: 'Supplier added successfully.', supplier: newSupplier });
    } catch (error) {
        console.error(error.message);
        res.status(500).send({ error: 'Failed to add new supplier' });
    }
}

const getSupplierById = async (req, res) => {
    const { supplierId } = req.params;

    try {
        let supplier;

        if (isValidObjectId(supplierId)) {
            supplier = await Supplier.findById(supplierId); // Search by MongoDB ID
        } else {
            supplier = await Supplier.findOne({ supplierId: supplierId }); // Search by custom ID
        }

        if (!supplier) {
            res.status(404).send({ message: 'Supplier not found.' })
        }
        res.status(200).send(supplier)
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch supplier' });
    }
}

const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedSupplier = await Supplier.findByIdAndUpdate(id, req.body, { new: true });

        if (!updatedSupplier) {
            res.status(404).send({ message: 'Supplier not found.' })
        }

        res.status(200).send({ message: 'Supplier updated successfully.', supplier: updatedSupplier })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to update supplier' });
    }
}

const deleteSupplier = async (req, res) => {
    const { id } = req.params;
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const supplier = await Supplier.findById(id).session(session);
        if (!supplier) {
            res.status(404).send({ message: 'Supplier not found.' })
        }

        // Delete the reviews and favorites associated with the supplier
        await Review.deleteMany({
            reviewFor: id,
            reviewForModel: "Supplier"
        });
        await Favorite.deleteMany({
            favoriteId: id,
            favoriteType: "Supplier"
        });

        // Find related ProductSupplier items
        const productSuppliers = await ProductSupplier.find({ supplier: id }).session(session);

        // Remove each link and clean up related data
        for (const productLink of productSuppliers) {
            await removeLink(productLink.product, id, 'supplier');
        }

        // Delete supplier
        const deletedSupplier = await Supplier.findByIdAndDelete(id).session(session);

        await session.commitTransaction();

        res.status(200).send({ message: 'Supplier deleted successfully.', supplier: deletedSupplier })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to delete supplier' });
    }
}

const getRating = async (req, res) => {
    const { id } = req.params;

    try {
        const supplier = await Supplier.findById(id);
        if (!supplier) {
            return res.status(404).json({ message: "Supplier not found" });
        }

        res.json({ rating: supplier.rating });
    } catch (error) {
        console.log("Error fetching supplier rating:", error.message);
        res.status(500).json({ message: "Failed to fetch supplier rating" });
    }
}

// Get products of a supplier
const getProducts = async (req, res) => {
    const { id } = req.params;

    try {
        let supplierId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const products = await getSupplierProducts(supplierId);

        if (!products || products.length === 0) {
            return res.status(204).json({ message: 'No products found for this supplier.' });
        }

        res.status(200).json(products);
    } catch (error) {
        console.log('Error fetching products for supplier:', error.message);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
}

const linkProduct = async (req, res) => {
    const { id } = req.params;
    const { productId, price, quantity } = req.body;

    if (!id || !productId || !price || !quantity) {
        return res.status(400).json({ error: "Product ID, Supplier ID, price, and quantity are required" });
    }

    try {
        let supplierId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const product = await Product.findOne({ productId: productId })

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Create new link between product and supplier
        const result = await newLink(product._id, supplierId, price, quantity);

        res.status(200).json({ message: 'Product linked to supplier successfully.', connection: result });
    } catch (error) {
        console.log('Error linking product to supplier:', error.message);
        res.status(500).json({ message: 'Failed to link product to supplier.' });
    }
}

const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { productId, quantity, price } = req.body;

    if (!id || !productId || (quantity === undefined && price === undefined)) {
        return res.status(400).json({ error: "Product ID, Supplier ID, price or quantity are required" });
    }

    try {
        let supplierId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const product = await Product.findOne({ productId: productId })

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        if (price !== undefined) {
            await updatePrice(product._id, supplierId, price);
        }

        if (quantity !== undefined) {
            await updateQuantity(product._id, supplierId, quantity);
        }

        // Update product-supplier link
        updatedConnection = await ProductSupplier.findOne({ product: product._id, supplier: supplierId });

        res.status(200).json({ message: 'Product link updated successfully.', connection: updatedConnection });
    } catch (error) {
        console.log('Error linking product to supplier:', error.message);
        res.status(500).json({ message: 'Failed to link product to supplier.' });
    }
}

const removeProduct = async (req, res) => {
    const { id, productId } = req.params;

    if (!id || !productId) {
        return res.status(400).json({ error: "Product ID and Supplier ID are required" });
    }

    try {
        let supplierId;

        // Check if the id is a valid ObjectId
        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const product = await Product.findOne({ productId: productId })

        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        // Remove product-supplier link
        const result = await removeLink(product._id, supplierId);

        res.status(200).json({ message: 'Product removed successfully.', connection: result });
    } catch (error) {
        console.log('Error removing product from supplier:', error.message);
        res.status(500).json({ message: 'Failed to remove product from supplier.' });
    }
}

const adminGetProducts = async (req, res) => {
    const { id } = req.params;
    const { limit = 10, page = 1, sort = 'name', searchQuery, categoryName } = req.query;

    try {
        let supplierId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const { products, totalProducts } = await getSupplierProductsAdmin(supplierId, { limit, page, sort, searchQuery, categoryName });

        const totalPages = Math.ceil(totalProducts / limit);

        if (!products || products.length === 0) {
            return res.status(204).json({ message: 'No products found for this supplier.' });
        }

        res.status(200).json({
            products,
            totalProducts,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.log('Error fetching products for supplier:', error.message);
        res.status(500).json({ message: 'Failed to fetch products.' });
    }
}

const deleteSuppliers = async (req, res) => {
    const { supplierIds } = req.body;

    if (!Array.isArray(supplierIds) || !supplierIds.length) {
        return res.status(400).send({ error: "No suppliers provided for deletion." });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const suppliers = await Supplier.find({ _id: { $in: supplierIds } }).session(session);
        if (!suppliers.length) {
            await session.abortTransaction();
            return res.status(404).send({ message: "No suppliers found." });
        }

        // Delete reviews and favorites associated with these suppliers
        await Review.deleteMany({
            reviewFor: { $in: supplierIds },
            reviewForModel: "Supplier"
        }).session(session);

        await Favorite.deleteMany({
            favoriteId: { $in: supplierIds },
            favoriteType: "Supplier"
        }).session(session);

        // Find all related ProductSupplier links
        const productSuppliers = await ProductSupplier.find({ supplier: { $in: supplierIds } }).session(session);

        // Remove each product-supplier link
        for (const productLink of productSuppliers) {
            await removeLink(productLink.product, productLink.supplier, 'supplier');
        }

        // Bulk delete suppliers
        const deletedSuppliers = await Supplier.deleteMany({ _id: { $in: supplierIds } }).session(session);

        await session.commitTransaction();

        res.status(200).send({ message: "Suppliers deleted successfully.", deletedCount: deletedSuppliers.deletedCount });
    } catch (error) {
        await session.abortTransaction();
        console.log(error.message);
        res.status(500).send({ error: "Failed to delete suppliers" });
    } finally {
        session.endSession();
    }
}

const bulkRemoveProducts = async (req, res) => {
    const { id } = req.params;
    const { productIds } = req.body;

    console.log(id, productIds)

    if (!id || !Array.isArray(productIds) || productIds.length === 0) {
        return res.status(400).json({ error: "Supplier ID and a valid array of Product IDs are required" });
    }

    try {
        let supplierId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        // Find the product IDs in the database
        const products = await Product.find({ _id: { $in: productIds } });

        if (!products || products.length === 0) {
            return res.status(404).json({ message: 'No matching products found.' });
        }

        // Extract valid product IDs
        const productObjectIds = products.map(product => product._id);

        // Remove links for each product
        const removalResults = await Promise.all(
            productObjectIds.map(productId => removeLink(productId, supplierId))
        );

        res.status(200).json({
            message: 'Products removed successfully.',
            removedConnections: removalResults
        });
    } catch (error) {
        console.log('Error removing products from product:', error.message);
        res.status(500).json({ message: 'Failed to remove products from supplier.' });
    }
}

const adminExportProducts = async (req, res) => {
    const { id } = req.params;
    const { exportType, productIds, searchQuery, categoryName } = req.body;

    try {
        let supplierId;

        if (mongoose.Types.ObjectId.isValid(id)) {
            supplierId = id;
        } else {
            const supplier = await Supplier.findOne({ supplierId: id });
            if (!supplier) {
                return res.status(404).json({ message: 'Supplier not found.' });
            }
            supplierId = supplier._id.toHexString();
        }

        const { products } = await getSupplierProductsAdmin(supplierId, {
            limit: null,
            page: 1,
            sort: 'price',
            searchQuery,
            categoryName
        });

        if (!products || products.length === 0) {
            return res.status(204).json({ message: 'No products found.' });
        }

        // Filter if only selected products should be exported
        let filteredProducts = products;
        if (exportType === 'selected' && productIds?.length) {
            filteredProducts = products.filter(product =>
                productIds.includes(product.productDetails._id.toString())
            );
        }

        if (!filteredProducts.length) {
            return res.status(204).json({ message: 'No matching products found.' });
        }

        // Transform data for CSV export
        const csvData = filteredProducts.map(product => ({
            _id: product.productDetails._id,
            productId: product.productDetails.productId,
            productName: product.productDetails.name,
            productCategory: product.productDetails.categoryInfo?.name,
            price: product.price,
            quantity: product.quantity
        }));

        // Define CSV fields
        const fields = ['productId', 'productName', 'productCategory', 'price', 'quantity'];
        const parser = new Parser({ fields });
        const csv = parser.parse(csvData);

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=products.csv');
        res.status(200).send(csv);

    } catch (error) {
        console.error('Error exporting products:', error.message);
        res.status(500).json({ message: 'Failed to export products.' });
    }
}

// Get top suppliers by sales
const getTopSuppliers = async (req, res) => {
    try {
        const { startDate, endDate, limit = 5 } = req.query;

        const matchConditions = [];

        // Filter by date range if provided
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate) dateFilter.$gte = new Date(startDate);
            if (endDate) dateFilter.$lte = new Date(endDate);

            matchConditions.push({
                'createdAt': dateFilter,
            });
        }

        const topSuppliers = await OrderProduct.aggregate([
            {
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
                $lookup: {
                    from: 'suppliers',
                    localField: 'productSupplierDetails.supplier',
                    foreignField: '_id',
                    as: 'supplierDetails',
                },
            },
            {
                $unwind: '$supplierDetails',
            },
            {
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
                $match: matchConditions.length ? { $and: matchConditions } : {},
            },
            {
                // Group by supplier ID and calculate total sales
                $group: {
                    _id: '$supplierDetails._id',
                    supplierId: { $first: '$supplierDetails.supplierId' },
                    name: { $first: '$supplierDetails.name' },
                    email: { $first: '$supplierDetails.contact.email' },
                    phone: { $first: '$supplierDetails.contact.phone' },
                    totalSales: { $sum: '$quantity' },
                },
            },
            {
                $sort: { totalSales: -1 },
            },
            {
                $limit: parseInt(limit, 10),
            }
        ]);

        res.status(200).json(topSuppliers);
    } catch (error) {
        console.error('Error fetching top suppliers:', error);
        res.status(500).json({ message: 'Failed to fetch top suppliers.' });
    }
}

// Get suppliers created in the last 7 days
const getNewSuppliers = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newSuppliers = await Supplier.find({ createdAt: { $gte: sevenDaysAgo } })
            .sort({ createdAt: -1 });

        res.status(200).json(newSuppliers);
    } catch (error) {
        console.error("Error fetching new suppliers:", error);
        res.status(500).json({ message: "Failed to fetch new suppliers." });
    }
}

module.exports = {
    getSuppliers,
    addNewSupplier,
    createSupplier,
    getSupplierById,
    updateSupplier,
    deleteSupplier,
    getRating,
    getProducts,
    linkProduct,
    updateProduct,
    removeProduct,
    adminGetProducts,
    deleteSuppliers,
    exportSuppliers,
    bulkRemoveProducts,
    adminExportProducts,
    getTopSuppliers,
    getNewSuppliers
}