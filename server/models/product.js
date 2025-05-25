const mongoose = require('mongoose');
const Schema = mongoose.Schema

const productSchema = new Schema({
    productId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        required: true
    },
    specifications: [
        {
            name: { type: String, required: true },
            value: { type: String, required: true },
            isCustom: { type: Boolean, default: false }
        },
    ],
    price: {
        type: Number,
        required: true,
        default: 0
    },
    stock: {
        type: Number,
        required: true,
        default: 0
    },
    rating: {
        type: Number,
        default: 0
    },
    imageUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    updatedBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    }
}, {
    timestamps: true,
});

productSchema.index({ productId: 1 }, { unique: true });

const ProductModel = mongoose.model('Product', productSchema);

module.exports = ProductModel;