const ProductSupplier = require('../models/productSupplier')
const mongoose = require('mongoose');
const Product = require('../models/product')
const Supplier = require('../models/supplier')
const Review = require('../models/review')
const Favorite = require('../models/favorite');
const sendEmail = require('../config/mailer');

const updateMainPrice = async (productId) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const prices = await ProductSupplier
            .find({ product: productId, status: 'available' })
            .sort({ price: 1 })
            .limit(1);

        const lowestPrice = prices[0]?.price || null;

        const product = await Product.findById(productId).session(session);

        const isPriceDropped = lowestPrice !== null && (product.price === null || lowestPrice < product.price);

        await Product.findByIdAndUpdate(productId, { price: lowestPrice });

        if (isPriceDropped) {
            //console.log(`Main price for ${productId} dropped to ${lowestPrice}`);

            // Find users who favorited this product
            const favorites = await Favorite.find({ favoriteId: productId, favoriteType: 'Product' })
                .populate("user")
                .session(session);

            for (let fav of favorites) {
                const user = fav.user;

                if (!user) continue;

                // Send email notification
                await sendEmail(
                    user.email,
                    "Price Drop Alert!",
                    `
                    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px;">
                        <h2 style="color: #fc814a; text-align: center;">Price Drop!</h2>
                        <p style="text-align: center;">The product <strong>${product.name}</strong> has dropped in price to <strong>${lowestPrice}€</strong>.</p>
                        <div style="text-align: center; margin: 20px 0;">
                            <a href="http://localhost:5173/products/${product.productId}"
                            style="background-color: #fc814a; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 10px; font-size: 16px; display: inline-block;">
                            Check it out!
                            </a>
                        </div>
                        <p style="text-align: center;">Best regards,<br>ProcureWise</p>
                    </div>
                    `
                );
            }
        }

        await session.commitTransaction();
        session.endSession();
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log('Error updating main price:', error);
        throw error;
    }
}

const updateMainStock = async (productId, quantityChange) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        // Ensure productId is an ObjectId
        if (!(productId instanceof mongoose.Types.ObjectId)) {
            productId = mongoose.Types.ObjectId.createFromHexString(productId);
        }

        const product = await Product.findById(productId);
        if (!product) {
            throw new Error('Product not found.');
        }

        // Update the product's stock based on the quantityChange
        const newStock = product.stock + quantityChange;

        if (newStock < 0) {
            throw new Error('Insufficient total stock');
        }

        await Product.findByIdAndUpdate(productId, { stock: newStock });

        await session.commitTransaction();
        session.endSession();

        /*console.log(`Updated main stock for Product ID ${productId}: New Stock quantity ${totalStock}`);*/
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        console.log('Error updating main stock:', error);
        throw error;
    }
}

const updateRating = async (type, id) => {
    try {
        // Fetch all reviews for the given product or supplier
        const reviews = await Review.find({
            reviewFor: (id),
            reviewForModel: type
        });

        // Calculate the new average rating
        const totalReviews = reviews.length;
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const rating = totalReviews ? (totalRating / totalReviews).toFixed(2) : 0;

        // Update the corresponding product or supplier with the new average rating
        if (type === 'Product') {
            await Product.findByIdAndUpdate(id, { rating });
        } else if (type === 'Supplier') {
            await Supplier.findByIdAndUpdate(id, { rating });
        }

        console.log(`Updated rating for ${type} ${id} to ${rating}`);
    } catch (error) {
        console.log(`Error updating rating for ${type} ${id}:`, error);
        throw error;
    }
}

module.exports = {
    updateMainPrice,
    updateMainStock,
    updateRating
}