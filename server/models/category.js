const mongoose = require('mongoose');
const Schema = mongoose.Schema

const CategorySchema = new Schema({
    name: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true
    },
    parent: {
        type: Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    description: {
        type: String
    },
    subcategories: [{
        type: Schema.Types.ObjectId,
        ref: 'Category',
    }],
    specifications: [
        {
            name: { type: String, required: true },
            type: { type: String, enum: ['String', 'Number', 'Boolean'], required: true },
            unit: { type: String },
            possibleValues: [Schema.Types.Mixed],
            required: { type: Boolean, default: false },
        },
    ],
    imageUrl: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true,
});

const CategoryModel = mongoose.model('Category', CategorySchema);
module.exports = CategoryModel;