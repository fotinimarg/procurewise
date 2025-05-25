const mongoose = require('mongoose');
const Schema = mongoose.Schema

const supplierSchema = new Schema({
    supplierId: {
        type: String,
        unique: true,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    contact: {
        email: String,
        phone: String,
        address: String
    },
    vatNumber: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    logo: {
        type: String,
    },
    rating: {
        type: Number,
        default: 0
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
});

supplierSchema.index({ supplierId: 1 }, { unique: true });

const SupplierModel = mongoose.model('Supplier', supplierSchema);
module.exports = SupplierModel;