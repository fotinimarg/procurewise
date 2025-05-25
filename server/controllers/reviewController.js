const { updateRating } = require('../helpers/updates');
const Review = require('../models/review');

const getReviewsByType = async (req, res) => {
    const { reviewForId, reviewForType, page = 1, limit = 8 } = req.query;

    try {
        const skip = (page - 1) * limit;

        const reviews = await Review.find({
            reviewFor: reviewForId,
            reviewForModel: reviewForType
        })
            .skip(skip)
            .limit(Number(limit))
            .populate('user', 'username') // Populate the username of the user
            .sort({ createdAt: -1 });

        const totalReviews = await Review.countDocuments({ reviewFor: reviewForId, reviewForModel: reviewForType });

        res.json({
            reviews,
            totalReviews,
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch reviews' });
    }
}

const addReviewByType = async (req, res) => {
    const { content, rating, typeId, type, user } = req.body;

    try {
        // Create a new review
        const newReview = new Review({
            content,
            rating,
            reviewFor: typeId,
            reviewForModel: type,
            user,
        });

        await newReview.save();

        // Update product's or supplier's rating
        await updateRating(type, typeId);
        res.status(201).json({ message: 'Review added successfully', review: newReview });
    } catch (error) {
        console.log('Error adding review:', error.message);
        res.status(500).json({ message: 'Failed to add review' });
    }
}

const getUserReviews = async (req, res) => {
    const userId = req.user.id;
    const { type, limit = 5, offset = 0 } = req.query;

    try {
        const query = { user: userId };

        if (type === "product") query.reviewForModel = "Product";
        if (type === "supplier") query.reviewForModel = "Supplier";

        const reviews = await Review.find(query)
            .populate('reviewFor', 'name productId supplierId')
            .populate('user', 'username')
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .lean();

        const updatedReviews = reviews.map(review => ({
            ...review,
            user: review.user ? review.user : { username: "Anonymous" }
        }));

        res.status(200).json(updatedReviews);
    } catch (error) {
        console.error('Error fetching user reviews:', error.message);
        res.status(500).json({ message: 'Failed to fetch user reviews.' });
    }
}

const deleteReview = async (req, res) => {
    const { reviewId } = req.params;

    try {
        const deletedReview = await Review.findByIdAndDelete(reviewId);

        if (!deletedReview) {
            return res.status(404).json({ message: 'Review not found' });
        }

        const type = deletedReview.reviewForModel;
        const typeId = deletedReview.reviewFor;

        // Update product's or supplier's rating
        await updateRating(type, typeId);

        res.status(200).json({ message: 'Review deleted successfully' });
    } catch (error) {
        console.log('Error deleting review:', error.message);
        res.status(500).json({ message: 'Failed to delete review' });
    }
}

module.exports = {
    getReviewsByType,
    addReviewByType,
    getUserReviews,
    deleteReview
}