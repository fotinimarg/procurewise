const { updateMainPrice, updateMainStock } = require('../helpers/updates');
const OrderProduct = require('../models/orderProduct');
const Order = require('../models/order');
const ProductSupplier = require('../models/productSupplier');
const mongoose = require('mongoose');
const Category = require('../models/category');

// Get suppliers of a product
const getProductSuppliers = async (productId) => {
    const result = await ProductSupplier.aggregate([
        {
            $match: {
                product: mongoose.Types.ObjectId.createFromHexString(productId),
                status: 'available'
            }
        },
        { $sort: { price: 1 } },
        {
            $lookup: {
                from: 'suppliers',
                localField: 'supplier',
                foreignField: '_id',
                as: 'supplierDetails'
            }
        },
        { $unwind: '$supplierDetails' }
    ]);

    return result;
}

// Get products of a supplier
const getSupplierProducts = async (supplierId) => {
    const result = await ProductSupplier.aggregate([
        {
            $match: {
                supplier: mongoose.Types.ObjectId.createFromHexString(supplierId),
                status: 'available'
            }
        },
        {
            $lookup: {
                from: 'products',
                localField: 'product',
                foreignField: '_id',
                as: 'productDetails'
            }
        },
        { $unwind: '$productDetails' }
    ]);

    return result;
}

// Get suppliers of a product - admin
const getProductSuppliersAdmin = async (productId, { limit = 15, page = 1, sort = 'price', searchQuery }) => {
    const skip = (page - 1) * limit;
    const limitValue = limit ? parseInt(limit, 15) : null;

    try {
        // Search filtering
        let searchFilter = {};
        if (searchQuery) {
            searchFilter = {
                $or: [
                    { 'supplierDetails.name': { $regex: searchQuery, $options: 'i' } },
                    { 'supplierDetails.contact.address': { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        const pipeline = [
            { $match: { product: mongoose.Types.ObjectId.createFromHexString(productId) } },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: 'supplier',
                    foreignField: '_id',
                    as: 'supplierDetails'
                }
            },
            { $unwind: '$supplierDetails' },
            { $match: searchFilter },
            { $sort: { [sort]: 1 } }
        ];

        // Only apply skip and limit if limit is specified
        if (limitValue) {
            pipeline.push({ $skip: skip }, { $limit: limitValue });
        }

        const result = await ProductSupplier.aggregate(pipeline);

        const totalSuppliers = await ProductSupplier.aggregate([
            { $match: { product: mongoose.Types.ObjectId.createFromHexString(productId) } },
            {
                $lookup: {
                    from: 'suppliers',
                    localField: 'supplier',
                    foreignField: '_id',
                    as: 'supplierDetails'
                }
            },
            { $unwind: '$supplierDetails' },
            { $match: searchFilter },
            { $count: 'total' }
        ]);

        return {
            suppliers: result,
            totalSuppliers: totalSuppliers.length > 0 ? totalSuppliers[0].total : 0
        };
    } catch (error) {
        console.error('Error fetching suppliers for product:', error.message);
        throw new Error('Failed to fetch suppliers');
    }
}

// Helper function to recursively fetch all subcategories
const getAllSubcategories = async (categoryId) => {
    const category = await Category.findById(categoryId);
    let subcategories = category?.subcategories || [];

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

// Get products of a supplier - admin
const getSupplierProductsAdmin = async (supplierId, { limit = 15, page = 1, sort = 'name', searchQuery, categoryName }) => {
    const skip = (page - 1) * limit;
    const limitValue = limit ? parseInt(limit, 15) : null;

    try {
        // Search filtering
        let searchFilter = {};
        if (searchQuery) {
            searchFilter = {
                $or: [
                    { 'productDetails.productId': { $regex: searchQuery, $options: 'i' } },
                    { 'productDetails.name': { $regex: searchQuery, $options: 'i' } },
                    { 'productDetails.description': { $regex: searchQuery, $options: 'i' } }
                ]
            };
        }

        // Category filtering
        let categoryFilter = {};
        if (categoryName) {
            const categoryData = await Category.findOne({ name: categoryName });

            if (!categoryData) {
                throw new Error('Category not found');
            }

            let categoryIds = [categoryData._id];
            if (categoryData.subcategories && categoryData.subcategories.length > 0) {
                const subcategoryIds = await getAllSubcategories(categoryData._id);
                categoryIds = categoryIds.concat(subcategoryIds);
            }

            categoryFilter = { 'productDetails.category': { $in: categoryIds } };
        }

        const pipeline = [
            { $match: { supplier: mongoose.Types.ObjectId.createFromHexString(supplierId) } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            {
                $lookup: {
                    from: 'categories',
                    localField: 'productDetails.category',
                    foreignField: '_id',
                    as: 'productDetails.categoryInfo'
                }
            },
            { $unwind: { path: '$productDetails.categoryInfo', preserveNullAndEmptyArrays: true } },
            { $match: { ...searchFilter, ...categoryFilter } },
            { $sort: { [`productDetails.${sort}`]: 1 } }
        ];

        // Only apply skip and limit if limit is specified
        if (limitValue) {
            pipeline.push({ $skip: skip }, { $limit: limitValue });
        }

        const result = await ProductSupplier.aggregate(pipeline);

        const totalProducts = await ProductSupplier.aggregate([
            { $match: { supplier: mongoose.Types.ObjectId.createFromHexString(supplierId) } },
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productDetails'
                }
            },
            { $unwind: '$productDetails' },
            { $match: { ...searchFilter, ...categoryFilter } },
            { $count: 'total' }
        ])

        return {
            products: result,
            totalProducts: totalProducts.length > 0 ? totalProducts[0].total : 0
        }
    } catch (error) {
        console.error('Error fetching products for supplier:', error.message);
        throw new Error('Failed to fetch products');
    }
}

// Function to add a product-supplier connection
const newLink = async (productId, supplierId, price, quantity, options = {}) => {
    const { skipPriceUpdate = false, skipStockUpdate = false } = options;
    try {
        // Check if the connection already exists
        const existingConnection = await ProductSupplier.findOne({ product: productId, supplier: supplierId });

        if (existingConnection) {
            console.log('Connection already exists between this product and supplier.');
            return existingConnection;
        }

        // Create a new connection if it doesn't exist
        const newProductSupplier = new ProductSupplier({
            product: productId,
            supplier: supplierId,
            price: price,
            quantity: quantity
        });

        const savedProductSupplier = await newProductSupplier.save();

        // Optionally update price and stock
        if (!skipPriceUpdate) {
            await updateMainPrice(productId);
        }
        if (!skipStockUpdate) {
            await updateMainStock(productId, parseInt(quantity));
        }

        console.log('Product-supplier connection added successfully:', savedProductSupplier);
        return savedProductSupplier;
    } catch (error) {
        console.log('Error adding product-supplier connection:', error);
        throw error;
    }
}

const removeOrderProductFromCart = async (orderProductId, session) => {
    const orderProduct = await OrderProduct.findById(orderProductId).session(session);
    if (!orderProduct) return;

    const productSupplier = await ProductSupplier.findById(orderProduct.productSupplier).session(session);
    if (!productSupplier) return;

    const carts = await Order.find({
        status: 'cart',
        groupedProducts: {
            $elemMatch: {
                products: orderProductId
            }
        }
    }).session(session);

    for (let cart of carts) {
        const supplierGroup = cart.groupedProducts.find(group =>
            group.supplier.equals(productSupplier.supplier)
        );

        if (supplierGroup) {
            supplierGroup.products = supplierGroup.products.filter(
                pid => pid.toString() !== orderProductId.toString()
            );
        }

        // Update cart's total amount
        const priceChange = productSupplier.price * orderProduct.quantity;

        if (cart.coupon?.discount) {
            const discount = cart.coupon.discount;
            cart.subtotal -= priceChange - priceChange * (discount / 100);
        } else {
            cart.subtotal -= priceChange;
        }

        cart.totalAmount = cart.subtotal;

        // Remove empty supplier group
        cart.groupedProducts = cart.groupedProducts.filter(group => group.products.length > 0);

        if (cart.groupedProducts.length === 0) {
            cart.shippingCost = 0;
        }

        await cart.save({ session });
    }

    await OrderProduct.findByIdAndDelete(orderProductId).session(session);
}

const removeLink = async (productId, supplierId, deleting) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find connection
        const connection = await ProductSupplier.findOne({
            product: productId,
            supplier: supplierId
        }).session(session);
        if (!connection) {
            console.log('No connection found between this product and supplier.');
            await session.abortTransaction();
            return null;
        }

        // Find related OrderProduct items and delete them
        const relatedOrderItems = await OrderProduct.find({
            productSupplier: connection._id,
        }).session(session);

        for (let orderProduct of relatedOrderItems) {
            await removeOrderProductFromCart(orderProduct._id, session);
        }

        // Delete the connection
        const deletedConnection = await ProductSupplier.findOneAndDelete({
            product: productId,
            supplier: supplierId
        }).session(session);

        //console.log('Product-supplier connection removed successfully:', deletedConnection);

        await session.commitTransaction();
        session.endSession();

        const quantity = connection.quantity;

        // Update product's main price and stock
        if (deleting !== 'product') {
            await updateMainPrice(productId);
            await updateMainStock(productId, -quantity);
        }
        return deletedConnection;
    } catch (error) {
        session.abortTransaction();
        session.endSession();
        console.log('Error removing product-supplier connection:', error);
        throw error;
    }
}

const updatePrice = async (productId, supplierId, price) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the connection to update
        const connection = await ProductSupplier.findOne({ product: productId, supplier: supplierId }).session(session);

        if (!connection) {
            throw new Error('Connection between product and supplier not found.');
        }

        // Update the price
        connection.price = price;
        await connection.save();

        // Update associated OrderProduct items
        const orderProducts = await OrderProduct.find({
            productSupplier: connection._id,
            order: { $in: await Order.find({ status: "cart" }).distinct("_id") }
        }).session(session);

        for (const orderItem of orderProducts) {
            orderItem.priceAtOrderTime = price;
            await orderItem.save();

            // Update the total for the parent Order
            const parentOrder = await Order.findById(orderItem.order).session(session);

            if (parentOrder) {
                const updatedTotal = await OrderProduct.aggregate([
                    { $match: { order: parentOrder._id } },
                    { $group: { _id: null, total: { $sum: { $multiply: ['$priceAtOrderTime', '$quantity'] } } } },
                ]).session(session);

                const newTotal = updatedTotal[0]?.total || 0;
                parentOrder.subtotal = newTotal;
                await parentOrder.save();
            }
        }

        await session.commitTransaction();
        session.endSession();

        // Update the main price of the product
        await updateMainPrice(productId);
        return connection;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log('Error updating product-supplier connection:', error);
        throw error;
    }
}

const updateQuantity = async (productId, supplierId, quantity) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Find the connection to update
        const connection = await ProductSupplier.findOne({ product: productId, supplier: supplierId }).session(session);

        if (!connection) {
            throw new Error('Connection between product and supplier not found.');
        }

        // Calculate the difference in quantity
        const quantityDifference = parseInt(quantity) - connection.quantity;

        // Update the quantity and status
        connection.quantity = quantity;
        connection.status = quantity > 0 ? 'available' : 'out_of_stock';
        await connection.save();

        // Update associated OrderProduct items
        const orderProducts = await OrderProduct.find({ productSupplier: connection._id }).session(session);

        for (const orderItem of orderProducts) {
            if (orderItem.quantity > quantity) {
                orderItem.quantity = quantity;
            }
            await orderItem.save();
        }

        await session.commitTransaction();
        session.endSession();

        // Update the main stock of the product
        await updateMainStock(productId, quantityDifference);

        return connection;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log('Error updating product-supplier connection:', error);
        throw error;
    }
}

module.exports = {
    getProductSuppliers,
    getProductSuppliersAdmin,
    getSupplierProductsAdmin,
    getSupplierProducts,
    newLink,
    removeLink,
    updatePrice,
    updateQuantity
}