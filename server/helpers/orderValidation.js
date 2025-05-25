const Order = require('../models/order')

const ensureCartNotEmpty = async (req, res, next) => {
    try {
        const cart = await Order.findOne({ user: req.user.id });
        if (!cart || cart?.groupedProducts.length === 0) {
            return res.status(400).json({ error: "Your cart is empty." });
        }
        next();
    } catch (error) {
        console.error("Error checking cart:", error);
        res.status(500).json({ error: "Server error." });
    }
}

module.exports = {
    ensureCartNotEmpty
}