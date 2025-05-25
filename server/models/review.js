const mongoose = require('mongoose');
const Schema = mongoose.Schema

const reviewSchema = new Schema({
    content: {
        type: String,
    },
    rating: {
        type: Number,
        required: true
    },
    // Stores the id of the reviewed object
    reviewFor: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'reviewForModel'
    },
    // Stores the type: Product or Supplier
    reviewForModel: {
        type: String,
        required: true,
        enum: ['Product', 'Supplier']
    },
    // Reference to user making the review
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true,
})

const ReviewModel = mongoose.model('Review', reviewSchema);
module.exports = ReviewModel;