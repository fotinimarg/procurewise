const mongoose = require('mongoose');
const Favorite = require('../models/favorite');

const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;

        // Aggregation to find user's favorites and group by type
        const favorites = await Favorite.aggregate([
            { $match: { user: mongoose.Types.ObjectId.createFromHexString(userId) } },
            {
                $facet: {
                    // Separate products
                    products: [
                        { $match: { favoriteType: 'Product' } },
                        {
                            $lookup: {
                                from: 'products',
                                localField: 'favoriteId',
                                foreignField: '_id',
                                as: 'productDetails'
                            }
                        },
                        { $unwind: '$productDetails' },
                        { $project: { productDetails: 1 } }
                    ],
                    // Separate suppliers
                    suppliers: [
                        { $match: { favoriteType: 'Supplier' } },
                        {
                            $lookup: {
                                from: 'suppliers',
                                localField: 'favoriteId',
                                foreignField: '_id',
                                as: 'supplierDetails'
                            }
                        },
                        { $unwind: '$supplierDetails' },
                        { $project: { supplierDetails: 1 } }
                    ]
                }
            }
        ]);

        // Send the split results as a response
        res.status(200).json({
            products: favorites[0]?.products || [],
            suppliers: favorites[0]?.suppliers || []
        });
    } catch (error) {
        console.log('Error fetching user favorites:', error.message);
        res.status(500).json({ error: 'Failed to fetch user favorites' });
    }
}

const addFavoriteByType = async (req, res) => {
    try {
        const { typeId, type, userId } = req.body;

        if (userId !== req.user.id) {
            return res.status(403).send({ message: 'Unauthorized request.' });
        }
        // Check if favorite already exists for this user
        const existingFavorite = await Favorite.findOne({
            user: userId,
            favoriteId: typeId,
            favoriteType: type,
        });

        if (existingFavorite) {
            return res.status(400).json({ message: 'Already in favorites.' });
        }

        // Create new favorite
        const newFavorite = new Favorite({
            user: userId,
            favoriteId: typeId,
            favoriteType: type
        });
        await newFavorite.save();

        res.status(201).json({ message: 'Added to favorites', favorite: newFavorite });
    } catch (error) {
        console.log('Error adding to favorites:', error.message);
        res.status(500).json({ message: 'Failed to add to favorites' });
    }
}

// Check if a product or supplier is favourited by user
const checkFavorite = async (req, res) => {
    const { typeId, type } = req.params;
    const userId = req.user.id;

    try {
        const favorite = await Favorite.findOne({
            user: userId,
            favoriteId: typeId,
            favoriteType: type
        });

        if (favorite) {
            return res.status(200).json({ isFavorited: true });
        } else {
            return res.status(200).json({ isFavorited: false });
        }
    } catch (error) {
        console.log('Error checking favorite:', error.message);
        res.status(500).json({ message: 'Error checking favorite' });
    }
}

// Delete product or supplier from user's favorites 
const deleteFavorite = async (req, res) => {
    const { type, typeId } = req.params;
    const userId = req.user.id;

    try {
        const favorite = await Favorite.findOneAndDelete({
            favoriteType: type,
            favoriteId: typeId,
            user: userId
        });

        if (!favorite) {
            return res.status(404).json({ message: 'Favorite not found' });
        }

        res.status(200).json({ message: 'Favorite deleted successfully' });
    } catch (error) {
        console.log('Error deleting favorite:', error.message);
        res.status(500).json({ message: 'Failed to delete favorite' });
    }
}

module.exports = {
    getUserFavorites,
    addFavoriteByType,
    checkFavorite,
    deleteFavorite
}