const ProductSupplier = require('../models/productSupplier');
const Order = require('../models/order');
const OrderProduct = require('../models/orderProduct');
const mongoose = require('mongoose');

const getCart = async (req, res) => {
    try {
        const ownerId = req.user?.id || req.guestId;

        if (!ownerId) {
            return res.status(403).json({ message: 'Unauthorized request. Please log in or continue as a guest.' });
        }

        const query = {
            $or: [
                { user: mongoose.Types.ObjectId.isValid(ownerId) ? new mongoose.Types.ObjectId(ownerId) : null },
                { guestId: ownerId }
            ],
            status: 'cart'
        }

        // Find the user's cart and populate groupedProducts
        const cart = await Order.findOne(query)
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

        return res.status(200).json(cart ? cart.toObject() : { message: 'Cart is empty' });
    } catch (error) {
        console.error('Error fetching cart:', error.message);
        return res.status(500).json({ error: 'Failed to fetch cart.' });
    }
}

const addToCart = async (req, res) => {
    const { productSupplierId, quantity } = req.body;
    const ownerId = req.user?.id || req.guestId;

    if (!ownerId) {
        return res.status(403).json({ message: 'Unauthorized request. Please log in or continue as a guest.' });
    }

    try {
        const cart = await addToCartLogic(ownerId, productSupplierId, quantity);
        return res.status(200).json({
            message: 'Product added to cart successfully.',
            cart,
        });
    } catch (error) {
        console.error('Error adding to cart:', error.message);
        return res.status(400).json({ error: error.message });
    }
}

const addToCartLogic = async (ownerId, productSupplierId, quantity) => {
    const productSupplier = await ProductSupplier.findById(productSupplierId);
    if (!productSupplier) {
        throw new Error('Product-supplier not found.');
    }

    // Check if the requested quantity is available
    if (quantity > productSupplier.quantity) {
        throw new Error('Stock is not sufficient for the specified quantity.');
    }

    let cart;
    let userQuery = {};

    if (mongoose.Types.ObjectId.isValid(ownerId)) {
        userQuery = { user: new mongoose.Types.ObjectId(ownerId) };
    } else {
        userQuery = { guestId: ownerId };
    }

    cart = await Order.findOne({
        ...userQuery,
        status: 'cart'
    });

    if (!cart) {
        // Create a new cart
        if (mongoose.Types.ObjectId.isValid(ownerId)) {
            cart = new Order({ user: new mongoose.Types.ObjectId(ownerId), status: 'cart', groupedProducts: [] });
        } else {
            cart = new Order({ guestId: ownerId, status: 'cart', groupedProducts: [] });
        }
        await cart.save();
    }

    // Check if the supplier group already exists
    const supplierGroupIndex = cart.groupedProducts.findIndex(
        group => group.supplier.toString() === productSupplier.supplier._id.toString()
    );

    // Find or create a new order-product
    let orderProduct;
    if (supplierGroupIndex !== -1) {
        // If the supplier group exists, find the existing orderProduct for this product-supplier link
        orderProduct = await OrderProduct.findOne({ productSupplier: productSupplierId, order: cart._id });
        if (orderProduct) {
            // If product already exists, update the quantity
            const newQuantity = orderProduct.quantity + parseInt(quantity);
            if (newQuantity > productSupplier.quantity) {
                throw new Error('Stock is not sufficient for specified quantity.');
            }
            await OrderProduct.findByIdAndUpdate(orderProduct._id, { quantity: newQuantity });
        } else {
            // If product does not exist in this supplier group, create a new OrderProduct
            orderProduct = new OrderProduct({
                productSupplier: productSupplierId,
                quantity,
                order: cart._id,
                priceAtOrderTime: productSupplier.price,
            });
            await orderProduct.save();
            // Add the reference of the new orderProduct to the supplier group
            cart.groupedProducts[supplierGroupIndex].products.push(orderProduct._id);
        }
    } else {
        // If supplier group doesn't exist, create a new group and add the orderProduct
        orderProduct = new OrderProduct({
            productSupplier: productSupplierId,
            quantity,
            order: cart._id,
            priceAtOrderTime: productSupplier.price,
        });
        await orderProduct.save();

        cart.groupedProducts.push({
            supplier: productSupplier.supplier._id,
            products: [orderProduct._id],
        });
    }
    // Update the cart
    const priceChange = productSupplier.price * Number(quantity);

    if (cart.coupon.discount) {
        const discount = cart.coupon.discount;
        cart.subtotal += priceChange - priceChange * (discount / 100);
    } else {
        cart.subtotal += priceChange;
    }
    cart.totalAmount = cart.subtotal;

    await cart.save();

    return cart;
}

const updateOrderProduct = async (req, res) => {
    const { orderProductId } = req.params;
    const { quantity } = req.body;

    try {
        const orderProduct = await OrderProduct.findById(orderProductId);

        if (!orderProduct) {
            return res.status(404).json({ error: 'OrderProduct not found' });
        }

        // Find the associated ProductSupplier
        const productSupplier = await ProductSupplier.findById(orderProduct.productSupplier);

        if (!productSupplier) {
            return res.status(404).json({ error: 'ProductSupplier not found' });
        }

        // Validate stock availability
        if (quantity > productSupplier.quantity) {
            return res.status(400).json({ error: 'Insufficient stock available' });
        }

        // Calculate quantity change
        const quantityChange = parseInt(quantity) - orderProduct.quantity;
        orderProduct.quantity = parseInt(quantity);
        await orderProduct.save();

        // Update cart total amount
        const cart = await Order.findById(orderProduct.order);
        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Recalculate subtotal and total amount
        priceChange = productSupplier.price * quantityChange;
        if (cart.coupon.discount) {
            const discount = cart.coupon.discount;

            cart.subtotal += priceChange - priceChange * (parseInt(discount) / 100)
            cart.totalAmount = cart.subtotal;
        } else {
            cart.subtotal += priceChange;
            cart.totalAmount = cart.subtotal;
        }

        // Update the groupedProducts structure
        const supplierGroup = cart.groupedProducts.find(group =>
            group.supplier.toString() === productSupplier.supplier.toString()
        );

        if (supplierGroup) {
            const productIndex = supplierGroup.products.findIndex(
                productId => productId.toString() === orderProductId
            );

            if (productIndex === -1) {
                return res.status(400).json({ error: 'OrderProduct not found in grouped products' });
            }
        }

        await cart.save();

        res.json({ message: 'Quantity updated successfully', cart });
    } catch (error) {
        console.error('Error updating quantity:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}

const removeFromCart = async (req, res) => {
    try {
        const { orderProductId } = req.params;
        const ownerId = req.user?.id || req.guestId;

        if (!ownerId) {
            return res.status(403).json({ message: 'Unauthorized request. Please log in or continue as a guest.' });
        }

        // Find the user's cart
        let cart;
        if (req.user) {
            cart = await Order.findOne({ user: mongoose.Types.ObjectId.createFromHexString(ownerId), status: 'cart' });
        } else {
            cart = await Order.findOne({ guestId: ownerId, status: 'cart' });
        }

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the product in the order
        const orderProduct = await OrderProduct.findById(orderProductId);
        if (!orderProduct) {
            return res.status(404).json({ error: 'Product not found in cart.' });
        }

        const productSupplier = await ProductSupplier.findById(orderProduct.productSupplier);

        if (!productSupplier) {
            return res.status(404).json({ error: 'Product supplier not found.' });
        }

        // Ensure the product order belongs to the user's cart
        if (!cart.groupedProducts.some(group => group.products.includes(orderProductId))) {
            return res.status(400).json({ error: 'Product does not belong to this cart.' });
        }

        // Remove the product from the supplier group
        const supplierGroup = cart.groupedProducts.find(group =>
            group.supplier.equals(productSupplier.supplier)
        );

        if (supplierGroup) {
            supplierGroup.products = supplierGroup.products.filter(productId => productId.toString() !== orderProductId);
        }

        // Update the cart's total amount
        priceChange = productSupplier.price * orderProduct.quantity;
        if (cart.coupon.discount) {
            const discount = cart.coupon.discount;

            cart.subtotal -= priceChange - priceChange * (discount / 100)
        } else {
            cart.subtotal -= priceChange;
        }
        cart.totalAmount = cart.subtotal;

        // If the supplier group is empty, remove it
        if (supplierGroup && supplierGroup.products.length === 0) {
            cart.groupedProducts = cart.groupedProducts.filter(group =>
                !group.supplier.equals(supplierGroup.supplier));
        }

        // Save the updated cart
        await cart.save();

        if (cart.groupedProducts.length === 0) {
            cart.shippingCost = 0;
            await cart.save();
        }

        // Delete the orderProduct
        await OrderProduct.findByIdAndDelete(orderProductId);

        return res.status(200).json({
            message: 'Product removed from cart successfully.',
            cart
        });
    } catch (error) {
        console.error('Error removing product from cart:', error.message);
        return res.status(500).json({ error: 'Failed to remove product from cart.' });
    }
}

module.exports = {
    getCart,
    addToCart,
    addToCartLogic,
    updateOrderProduct,
    removeFromCart
}