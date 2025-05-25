const mongoose = require('mongoose');
const Schema = mongoose.Schema

const OrderProductSchema = new Schema({
    productSupplier: {
        type: Schema.Types.ObjectId,
        ref: 'ProductSupplier',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    priceAtOrderTime: {
        type: Number,
        required: true
    }
}, { timestamps: true });

const OrderProductModel = mongoose.model('OrderProduct', OrderProductSchema);
module.exports = OrderProductModel;
