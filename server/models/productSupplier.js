const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const productSupplierSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    supplier: {
        type: Schema.Types.ObjectId,
        ref: 'Supplier',
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['available', 'out_of_stock'],
        default: 'available'
    }
});

const ProductSupplierModel = mongoose.model('ProductSupplier', productSupplierSchema);
module.exports = ProductSupplierModel;