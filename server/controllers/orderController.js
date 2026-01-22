const { updateMainStock, updateMainPrice } = require("../helpers/updates");
const Order = require("../models/order");
const ProductSupplier = require("../models/productSupplier");
const User = require("../models/user")
const Counter = require('../models/counter');
const { Parser } = require('json2csv');
const { addToCartLogic } = require("./cartController");
const sendEmail = require('../config/mailer');
const { generateSupplierEmailBody, generateOrderConfirmation } = require('../helpers/emailUtils')

// Generate order's id
const generateOrderId = async () => {
    const counter = await Counter.findOneAndUpdate(
        { name: 'orderId' },
        { $inc: { value: 1 } },
        { new: true, upsert: true }
    );
    return `ORD-${counter.value}`;
};

// Get all orders of a user
const getOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await Order.find({
            user: userId
        })
            .populate({
                path: 'groupedProducts.supplier',
                select: 'name'
            })
            .populate({
                path: 'groupedProducts.products',
                populate: {
                    path: 'productSupplier',
                    populate: {
                        path: 'product',
                        select: 'name imageUrl productId'
                    },
                    select: 'price quantity'
                },
            });

        res.status(200).json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ message: 'Unable to fetch orders.' });
    }
}

// Get all completed orders - admin
const getCompletedOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            searchQuery = '',
            startDate,
            endDate
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: 'Invalid page or limit value' });
        }

        // Convert date filters
        let dateFilter = {};
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            dateFilter.orderDate = {};
            if (start) dateFilter.orderDate.$gte = new Date(start);
            if (end) dateFilter.orderDate.$lte = new Date(end);
        }

        const skip = (pageNumber - 1) * limitNumber;

        let matchConditions = { status: "completed" };

        // Apply search filter
        if (searchQuery) {
            matchConditions.$or = [
                { orderId: { $regex: searchQuery, $options: 'i' } },
                { 'user.username': { $regex: searchQuery, $options: 'i' } },
                { status: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Apply date filter
        if (Object.keys(dateFilter).length > 0) {
            matchConditions = { ...matchConditions, ...dateFilter };
        }

        const matchStage = Object.keys(matchConditions).length > 0 ? { $match: matchConditions } : null;

        const aggregationPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            ...(matchStage ? [matchStage] : []),
            { $sort: { orderDate: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
            {
                $project: {
                    orderId: 1,
                    orderDate: 1,
                    status: 1,
                    totalAmount: 1,
                    'user.username': 1
                }
            }
        ];

        const orders = await Order.aggregate(aggregationPipeline);

        // Count total orders
        const totalOrdersPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            ...(matchStage ? [matchStage] : []),
            { $count: 'total' }
        ];

        const totalOrdersResult = await Order.aggregate(totalOrdersPipeline);
        const totalOrders = totalOrdersResult.length > 0 ? totalOrdersResult[0].total : 0;

        res.status(200).json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limitNumber),
            currentPage: pageNumber
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

// Get all non-completed orders - admin
const getNonCompletedOrders = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            searchQuery = '',
            statusFilter = 'All',
            startDate,
            endDate
        } = req.query;

        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        if (isNaN(pageNumber) || isNaN(limitNumber) || pageNumber < 1 || limitNumber < 1) {
            return res.status(400).json({ error: 'Invalid page or limit value' });
        }

        // Convert date filters
        let dateFilter = {};
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate).setHours(0, 0, 0, 0) : null;
            const end = endDate ? new Date(endDate).setHours(23, 59, 59, 999) : null;

            dateFilter.orderDate = {};
            if (start) dateFilter.orderDate.$gte = new Date(start);
            if (end) dateFilter.orderDate.$lte = new Date(end);
        }

        const skip = (pageNumber - 1) * limitNumber;

        let matchConditions = { status: { $nin: ["completed", "cart"] } };

        // Apply search filter
        if (searchQuery) {
            matchConditions.$or = [
                { orderId: { $regex: searchQuery, $options: 'i' } },
                { 'user.username': { $regex: searchQuery, $options: 'i' } },
                { status: { $regex: searchQuery, $options: 'i' } }
            ];
        }

        // Apply status filter
        if (statusFilter && statusFilter !== 'All') {
            matchConditions.status = statusFilter;
        }

        // Apply date filter
        if (Object.keys(dateFilter).length > 0) {
            matchConditions = { ...matchConditions, ...dateFilter };
        }

        const matchStage = Object.keys(matchConditions).length > 0 ? { $match: matchConditions } : null;

        const aggregationPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            ...(matchStage ? [matchStage] : []),
            { $sort: { orderDate: -1 } },
            { $skip: skip },
            { $limit: limitNumber },
            {
                $project: {
                    orderId: 1,
                    orderDate: 1,
                    status: 1,
                    totalAmount: 1,
                    'user.username': 1
                }
            }
        ];

        const orders = await Order.aggregate(aggregationPipeline);

        // Count total orders
        const totalOrdersPipeline = [
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            ...(matchStage ? [matchStage] : []),
            { $count: 'total' }
        ];

        const totalOrdersResult = await Order.aggregate(totalOrdersPipeline);
        const totalOrders = totalOrdersResult.length > 0 ? totalOrdersResult[0].total : 0;

        res.status(200).json({
            orders,
            totalOrders,
            totalPages: Math.ceil(totalOrders / limitNumber),
            currentPage: pageNumber
        });
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}

// Get user's orders count
const ordersCount = async (req, res) => {
    const userId = req.user.id;
    if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
    }

    try {
        const ordersCount = await Order.countDocuments({
            user: userId,
            status: 'ordered'
        });
        res.json({ ordersCount });
    } catch (error) {
        console.error('Error fetching orders count:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
}

const exportOrders = async (req, res) => {
    let { orderIds, exportType, statusFilter, searchQuery, dateFrom, dateTo, currentPage = 1, itemsPerPage = 20 } = req.body;

    try {
        let filters = {};

        if (exportType === 'completed') {
            filters.status = 'completed';
        } else if (exportType === 'non-completed') {
            filters.status = { $ne: 'completed' };
        } else if (exportType === 'selected' && orderIds?.length) {
            filters._id = { $in: orderIds };
        } else if (statusFilter !== 'All') {
            filters.status = statusFilter;
        }

        if (dateFrom || dateTo) {
            filters.createdAt = {};
            if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
            if (dateTo) filters.createdAt.$lte = new Date(new Date(dateTo).setHours(23, 59, 59, 999));
        }

        if (searchQuery) {
            filters.$or = [
                { orderId: { $regex: new RegExp(searchQuery, "i") } },
                { "user.firstName": { $regex: new RegExp(searchQuery, "i") } },
                { "user.lastName": { $regex: new RegExp(searchQuery, "i") } },
                { "user.username": { $regex: new RegExp(searchQuery, "i") } }
            ];
        }

        let ordersQuery = Order.find(filters)
            .populate({
                path: 'user',
                select: 'firstName lastName username email businessName address phoneNumber vatNumber',
                options: { strictPopulate: false }
            })
            .populate({
                path: 'groupedProducts.supplier',
                select: 'name'
            })
            .sort({ createdAt: -1 })
            .lean();

        const orders = await ordersQuery.exec();

        if (!orders.length) {
            return res.status(404).json({ message: "No orders found." });
        }

        const fields = [
            'orderId', 'status', 'orderDate', 'subtotal', 'totalAmount', 'totalCommission',
            {
                label: 'supplierCommissions',
                value: row => row.groupedProducts?.map(gp => `${gp.supplier?.name || 'Unknown Supplier'}: ${gp.commission?.toFixed(2)}EUR`).join(" | ") || ""
            },
            {
                label: 'supplierTotals',
                value: row => row.groupedProducts?.map(gp => `${gp.supplier?.name || 'Unknown Supplier'}: ${gp.supplierTotal?.toFixed(2)}EUR`).join(" | ") || ""
            },
            'shippingMethod', 'shippingCost', 'shippingAddressId', 'contact', 'paymentMethod', 'invoiceType', 'vatNumber', 'isFlagged', 'adminNotes',
            { label: 'user.firstName', value: row => row.user?.firstName || 'Deleted User' },
            { label: 'user.lastName', value: row => row.user?.lastName || '' },
            { label: 'user.username', value: row => row.user?.username || '' },
            { label: 'user.email', value: row => row.user?.email || '' },
            { label: 'user.businessName', value: row => row.user?.businessName || '' },
            { label: 'user.vatNumber', value: row => row.user?.vatNumber || '' }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(orders);

        res.header('Content-Type', 'text/csv');
        res.attachment('orders.csv');
        res.send(csv);
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch orders' });
    }
}

const getStats = async (req, res) => {
    try {
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const stats = await Order.aggregate([
            {
                $match: { status: { $nin: ["cart", "canceled"] } }
            },
            {
                $facet: {
                    totalOrders: [{ $count: "total" }],

                    // Get commission per month
                    commissionPerMonth: [
                        { $match: { createdAt: { $gte: new Date(now.getFullYear(), 0, 1) } } },
                        {
                            $group: {
                                _id: { month: { $month: "$createdAt" } },
                                totalCommissions: { $sum: "$totalCommission" }
                            }
                        },
                        { $sort: { "_id.month": 1 } }
                    ],

                    // Get in-progress orders
                    inProgressOrders: [
                        { $match: { status: { $in: ["reviewed", "shipped"] } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "userInfo"
                            }
                        },
                        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                orderId: 1,
                                status: 1,
                                createdAt: 1,
                                totalAmount: 1,
                                "userInfo.username": { $ifNull: ["$userInfo.username", "Unknown"] }
                            }
                        }
                    ],

                    // Get new orders
                    newOrders: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $sort: { createdAt: -1 } },
                        { $limit: 5 },
                        {
                            $lookup: {
                                from: "users",
                                localField: "user",
                                foreignField: "_id",
                                as: "userInfo"
                            }
                        },
                        { $unwind: { path: "$userInfo", preserveNullAndEmptyArrays: true } },
                        {
                            $project: {
                                _id: 1,
                                orderId: 1,
                                status: 1,
                                createdAt: 1,
                                totalAmount: 1,
                                "userInfo.username": { $ifNull: ["$userInfo.username", "Unknown"] }
                            }
                        }
                    ],

                    // Get total commissions
                    totalCommissions: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        {
                            $group: {
                                _id: null,
                                totalCommissions: { $sum: "$totalCommission" }
                            }
                        }
                    ],

                    monthlySales: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        {
                            $group: {
                                _id: null,
                                totalSales: { $sum: "$totalAmount" }
                            }
                        }
                    ]
                }
            }
        ]);

        const formattedStats = {
            totalOrders: stats[0].totalOrders[0]?.total || 0,
            commissionPerMonth: stats[0].commissionPerMonth.map(item => ({ month: item._id.month, totalCommissions: item.totalCommissions })),
            inProgressOrders: stats[0].inProgressOrders || [],
            newOrders: stats[0].newOrders || [],
            totalCommissions: stats[0].totalCommissions[0]?.totalCommissions || 0,
            monthlySales: stats[0].monthlySales[0]?.totalSales || 0
        };

        res.json(formattedStats);
    } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}

const getOrderById = async (req, res) => {
    const { orderId } = req.params;

    try {
        const order = await Order.findOne({ orderId: orderId })
            .populate({
                path: 'groupedProducts.supplier',
                select: 'name supplierId contact'
            })
            .populate({
                path: 'groupedProducts.products',
                populate: {
                    path: 'productSupplier',
                    populate: {
                        path: 'product',
                        select: 'name imageUrl productId'
                    },
                    select: 'price quantity'
                },
            })
            .populate({
                path: 'user',
                select: 'address phoneNumber email username businessName firstName lastName fullName'
            });

        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }

        let shippingAddress = null;
        let phoneNumber = null;

        if (order.user) {
            // Extract the address and phone number only if the user exists
            if (order.shippingMethod === 'Delivery' && order.shippingAddressId) {
                shippingAddress = order.user.address?.find(
                    (addr) => addr._id.toString() === order.shippingAddressId.toString()
                ) || null;
            }

            phoneNumber = order.user.phoneNumber?.find(
                (num) => num._id.toString() === order.contact?.toString()
            ) || null;
        }

        // Include the shipping address and number in the response
        const orderWithContact = {
            ...order.toObject(),
            user: order.user || null,
            shippingAddress,
            phoneNumber
        };

        res.status(200).json(orderWithContact);
    } catch (error) {
        console.error("Error fetching order:", error);
        res.status(500).json({ error: 'Failed to fetch order details' });
    }
}

const checkout = async (req, res) => {
    const { cartId } = req.body;
    try {
        const cart = await Order.findOne({ _id: cartId, status: 'cart' }).populate({
            path: 'groupedProducts.products',
            populate: {
                path: 'productSupplier',
                populate: {
                    path: 'product',
                    select: 'name imageUrl'
                }
            },
            select: 'priceAtOrderTime quantity'
        }).populate({
            path: 'groupedProducts.supplier',
            select: 'name'
        }).populate({
            path: 'user',
            select: 'email firstName lastName'
        });

        if (!cart || cart.groupedProducts.length === 0) {
            return res.status(404).json({ message: 'Cart is empty or not found' });
        }

        // Handle stock validation and adjustments
        const stockIssues = [];
        for (const group of cart.groupedProducts) {
            group.products = group.products.filter(async (orderProduct) => {
                const productSupplier = await ProductSupplier.findById(orderProduct.productSupplier);

                if (!productSupplier) {
                    stockIssues.push({
                        type: 'missing',
                        message: `The supplier for the product "${orderProduct.name}" no longer exists.`,
                        product: orderProduct.name,
                    });
                    group.products = group.products.filter(p => p._id.toString() !== orderProduct._id.toString());
                    return false;
                }

                if (productSupplier.quantity < orderProduct.quantity) {
                    if (productSupplier.quantity > 0) {
                        // Notify user that the quantity has been adjusted
                        stockIssues.push({
                            type: 'stock',
                            message: `Insufficient stock for "${productSupplier.name}". The quantity has been reduced to ${productSupplier.quantity}.`,
                            product: productSupplier.name,
                        });
                        orderProduct.quantity = productSupplier.quantity;
                    } else {
                        // Remove product if out of stock
                        stockIssues.push({
                            type: 'stock',
                            message: `"${productSupplier.name}" is out of stock and has been removed from the cart.`,
                            product: productSupplier.name,
                        });
                        group.products = group.products.filter(p => p._id.toString() !== orderProduct._id.toString());
                        return false;
                    }
                }

                return true;
            });
        }

        if (stockIssues.length > 0) {
            return res.status(400).json({ message: 'Checkout failed due to stock issues.', issues: stockIssues });
        }

        // Deduct stock in bulk
        const bulkUpdates = [];
        for (const group of cart.groupedProducts) {
            for (const orderProduct of group.products) {
                const productSupplier = await ProductSupplier.findById(orderProduct.productSupplier);

                bulkUpdates.push({
                    updateOne: {
                        filter: { _id: productSupplier._id },
                        update: {
                            $inc: { quantity: -orderProduct.quantity },
                            $set: { status: productSupplier.quantity - orderProduct.quantity <= 0 ? 'out_of_stock' : productSupplier.status },
                        },
                    },
                });

                await updateMainPrice(productSupplier.product);
                await updateMainStock(productSupplier.product, -orderProduct.quantity);
            }
        }
        await ProductSupplier.bulkWrite(bulkUpdates);

        // Calculate 10% commission
        let totalCommission = 0;

        for (const group of cart.groupedProducts) {
            const supplierSubtotal = group.products.reduce((sum, orderProduct) => sum + (orderProduct.priceAtOrderTime * orderProduct.quantity), 0);

            group.supplierTotal = supplierSubtotal;
            const supplierCommission = supplierSubtotal * 0.10;

            group.commission = supplierCommission;
            totalCommission += supplierCommission;
        }

        cart.totalCommission = totalCommission;

        // Update order details
        cart.status = 'ordered';
        cart.orderId = await generateOrderId();
        cart.orderDate = new Date();

        await cart.save();

        const userEmail = cart.user.email;
        const emailBody = generateOrderConfirmation(cart.user.firstName, cart.user.lastName, cart.orderId, cart.groupedProducts, cart.totalAmount)

        await sendEmail(userEmail, `Order #${cart.orderId} Confirmation`, emailBody);

        res.status(200).json({ message: 'Order placed successfully.', order: cart });
    } catch (error) {
        console.log('Error during checkout:', error.message);
        res.status(500).json({ message: 'Failed to complete checkout.' });
    }
}

// Check if coupon is valid
const validateCoupon = async (req, res) => {
    const { code } = req.query;

    try {
        const coupons = {
            WELCOME10: { discount: 10, isPercentage: true },
        };

        const coupon = coupons[code.trim().toUpperCase()];
        if (!coupon) {
            return res.status(404).json({ message: 'Invalid coupon code.' });
        }

        res.status(200).json({
            message: 'Coupon is valid.',
            discount: coupon.discount,
            isPercentage: coupon.isPercentage,
        });
    } catch (error) {
        console.error('Error validating coupon:', error.message);
        res.status(500).json({ message: 'Failed to validate coupon.' });
    }
}

const applyCoupon = async (req, res) => {
    const { orderId, code } = req.body;

    try {
        const order = await Order.findById(orderId);
        if (!order || order.status !== 'cart') {
            return res.status(400).json({ message: 'Invalid or non-cart order.' });
        }

        // Define coupon rules
        const coupons = {
            WELCOME10: { discount: 10, isPercentage: true },
        }

        const coupon = coupons[code.trim().toUpperCase()];
        if (!coupon) {
            return res.status(400).json({ error: 'Invalid coupon code.' });
        }

        if (order.coupon.code) {
            return res.status(400).json({ error: `Coupon code '${order.coupon.code}' is already applied.` });
        }

        // Calculate the discount
        const originalTotal = order.subtotal;
        const discount = coupon.isPercentage
            ? (originalTotal * coupon.discount) / 100
            : coupon.discount;
        const discountedTotal = Math.max(originalTotal - discount, 0);

        // Update the order
        order.coupon = {
            code,
            discount: coupon.discount,
            isPercentage: coupon.isPercentage,
        };
        order.subtotal = discountedTotal;
        order.totalAmount = discountedTotal + (order.shippingCost || 0);

        await order.save();

        res.status(200).json({
            message: 'Coupon applied successfully.',
            subtotal: discountedTotal,
            totalAmount: order.totalAmount,
            coupon: order.coupon,
        });
    } catch (error) {
        console.error('Error applying coupon:', error.message);
        res.status(500).json({ message: 'Failed to apply coupon.' });
    }
}

const addShipping = async (req, res) => {
    const { orderId, shippingMethod, shippingCost, shippingAddressId } = req.body;

    if (!shippingMethod || shippingCost == null) {
        return res.status(400).json({ error: 'Shipping method and cost are required.' });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        // Update the shipping method and cost
        order.shippingMethod = shippingMethod;
        order.shippingCost = shippingCost;

        if ((shippingMethod === 'Delivery') && shippingAddressId) {
            order.shippingAddressId = shippingAddressId;
        }

        // Recalculate the total amount
        order.totalAmount = order.subtotal + shippingCost;

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating shipping cost:', error);
        res.status(500).json({ error: 'Failed to update shipping cost.' });
    }
}

// Add phone number to order
const addContact = async (req, res) => {
    const { orderId, contact } = req.body;

    if (!contact) {
        return res.status(400).json({ error: 'Contact info is required.' });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        order.contact = contact;

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating contact info:', error);
        res.status(500).json({ error: 'Failed to update contact info.' });
    }
}

const addPayment = async (req, res) => {
    const { orderId, totalAmount, paymentMethod } = req.body;

    if (!paymentMethod) {
        return res.status(400).json({ error: 'Payment method is required.' });
    }

    try {
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        // Update the payment method
        order.paymentMethod = paymentMethod;
        order.totalAmount = totalAmount;

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating shipping cost:', error);
        res.status(500).json({ error: 'Failed to update shipping cost.' });
    }
}

const addVatNumber = async (req, res) => {
    const { orderId, vatNumber, userId } = req.body;

    if (!vatNumber) {
        return res.status(400).json({ error: 'VAT Number is required.' });
    }

    try {
        await User.findByIdAndUpdate(userId, { vatNumber });

        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ error: 'Cart not found.' });
        }

        order.vatNumber = vatNumber;

        await order.save();
        res.status(200).json(order);
    } catch (error) {
        console.error('Error updating VAT number:', error);
        res.status(500).json({ error: 'Failed to update VAT number.' });
    }
}

const reorder = async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.id;

        // Fetch the completed order
        const order = await Order.findById(orderId).populate({
            path: 'groupedProducts.products',
            populate: { path: 'productSupplier', model: 'ProductSupplier' },
        });

        if (!order || order.status !== 'completed') {
            return res.status(404).json({ error: 'Order not found or not completed.' });
        }

        let cart;
        // Iterate through all grouped products and add them to the cart
        for (const group of order.groupedProducts) {
            for (const product of group.products) {
                cart = await addToCartLogic(userId, product.productSupplier._id, product.quantity);
            }
        }

        return res.status(200).json({ message: 'Reorder successful.', cartId: cart._id });
    } catch (error) {
        console.error('Error during reorder:', error.message);
        return res.status(500).json({ error: 'Failed to reorder products.' });
    }
}

// Change the status of an order
const statusChange = async (req, res) => {
    const { orderId } = req.params;
    const { status } = req.body;
    try {
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.status(200).json({ message: 'Status updated successfully', order });
    } catch (error) {
        res.status(500).json({ error: 'Failed to change status' });
    }
}

// Mark an order as flagged
const flagOrder = async (req, res) => {
    const { orderId } = req.params;
    const { isFlagged } = req.body;

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId },
            { isFlagged },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error flagging order:', error);
        res.status(500).json({ error: 'Failed to update flag status' });
    }
}

const addNotes = async (req, res) => {
    const { orderId } = req.params;
    const { adminNotes } = req.body;

    try {
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId },
            { adminNotes },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).json({ error: 'Order not found' });
        }

        res.status(200).json(updatedOrder);
    } catch (error) {
        console.error('Error updating notes:', error);
        res.status(500).json({ error: 'Failed to update admin notes' });
    }
}

const sendToSuppliers = async (req, res) => {
    const { order } = req.body;

    try {
        let shippingAddress = null;
        if (order.shippingMethod === 'Delivery') {
            shippingAddress = order.user?.address?.find(
                (addr) => addr._id.toString() === order.shippingAddressId.toString()
            );

            if (!shippingAddress) {
                return res.status(404).json({ error: 'Shipping address not found' });
            }
        }

        const phoneNumber = order.user?.phoneNumber?.find(
            (num) => num._id.toString() === order.contact.toString()
        )

        if (!phoneNumber) {
            return res.status(404).json({ error: 'Phone number not found' });
        }

        const parseContactInfo = (contactObj) => {
            return Object.entries(contactObj).map(([key, value]) => ({
                key: key.toLowerCase(),
                value: value.trim()
            }));
        }

        // Send email seperately to each supplier
        for (const group of order.groupedProducts) {
            const supplier = group.supplier;

            const parsedContact = parseContactInfo(supplier.contact);
            const emailDetail = parsedContact.find(detail => detail.key === 'email');
            const supplierEmail = emailDetail ? emailDetail.value : null;

            const products = group.products;
            const supplierTotal = group.supplierTotal;
            const commission = group.commission;

            const emailBody = generateSupplierEmailBody(
                supplier.name,
                products,
                order.user,
                order.shippingMethod,
                shippingAddress,
                phoneNumber,
                order.invoiceType,
                order.vatNumber,
                order.paymentMethod,
                order.coupon?.discount,
                supplierTotal,
                commission
            );

            await sendEmail(supplierEmail, `Order #${order.orderId} Details`, emailBody);
        }

        await Order.findByIdAndUpdate(order._id, { shared: true }, { new: true });

        res.status(200).json({ message: 'Orders sent to suppliers successfully' });
    } catch (error) {
        console.error('Error sharing order:', error);
        res.status(500).json({ error: 'Could not process supplier orders' });
    }
}

// Check if an order has been shared with the suppliers
const sharedStatus = async (req, res) => {
    try {
        const { orderId } = req.params;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        res.json({ shared: order.shared || false });
    } catch (error) {
        console.error("Error fetching shared status:", error);
        res.status(500).json({ message: "Server error" });
    }
}

const bulkUpdateStatus = async (req, res) => {
    const { orderIds, newStatus } = req.body;

    if (!orderIds || !newStatus) {
        return res.status(400).json({ error: "Order IDs and new status are required." });
    }

    try {
        await Order.updateMany(
            { _id: { $in: orderIds } },
            { $set: { status: newStatus } }
        );

        res.json({ message: "Order statuses updated successfully!" });
    } catch (error) {
        console.error("Error updating order status:", error);
        res.status(500).json({ error: "Failed to update order status." });
    }
}

module.exports = {
    getOrders,
    ordersCount,
    getOrderById,
    checkout,
    validateCoupon,
    applyCoupon,
    addShipping,
    addPayment,
    addContact,
    reorder,
    getCompletedOrders,
    getNonCompletedOrders,
    statusChange,
    flagOrder,
    addNotes,
    sendToSuppliers,
    sharedStatus,
    bulkUpdateStatus,
    exportOrders,
    getStats,
    addVatNumber
}
