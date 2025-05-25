const mongoose = require('mongoose');
const Schema = mongoose.Schema

const OrderSchema = new Schema({
    orderId: {
        type: String,
        required: function () { return this.status === 'ordered' },
        unique: true,
        sparse: true
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: function () { return !this.guestId; }
    },
    guestId: {
        type: String,
        required: function () { return !this.user; }
    },
    groupedProducts: [
        {
            supplier: { type: Schema.Types.ObjectId, ref: 'Supplier' },
            products: [{ type: Schema.Types.ObjectId, ref: 'OrderProduct' }],
            supplierTotal: { type: Number, default: 0 },
            commission: { type: Number, default: 0 }
        }
    ],
    subtotal: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        default: 0
    },
    totalCommission: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['cart', 'ordered', 'reviewed', 'shipped', 'completed', 'canceled'],
        required: true,
        default: 'cart'
    },
    shippingMethod: {
        type: String,
    },
    shippingCost: {
        type: Number,
        default: 0
    },
    shippingAddressId: {
        type: mongoose.Schema.Types.ObjectId,
        required: function () { return this.shippingMethod === 'Delivery' }
    },
    contact: {
        type: String
    },
    invoiceType: {
        type: String,
        enum: ['individual', 'business'],
        required: true,
        default: 'individual'
    },
    vatNumber: {
        type: String,
        required: function () { return this.invoiceType === 'business'; }
    },
    paymentMethod: {
        type: String,
        required: function () { return this.status === 'ordered' }
    },
    coupon: {
        code: { type: String },
        discount: { type: Number }
    },
    orderDate: {
        type: Date,
        default: Date.now
    },
    isFlagged: {
        type: Boolean,
        default: false,
    },
    adminNotes: {
        type: String,
        default: '',
    },
    shared: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const OrderModel = mongoose.model('Order', OrderSchema);
module.exports = OrderModel;