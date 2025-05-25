const mongoose = require('mongoose');
const Schema = mongoose.Schema

const favoriteSchema = new Schema({
    // Stores the id of the favorite object
    favoriteId: {
        type: Schema.Types.ObjectId,
        required: true,
        refPath: 'favoriteType'
    },
    // Stores the type: Product or Supplier
    favoriteType: {
        type: String,
        required: true,
        enum: ['Product', 'Supplier']
    },
    // Reference to user
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
})

const FavoriteModel = mongoose.model('Favorite', favoriteSchema);
module.exports = FavoriteModel;