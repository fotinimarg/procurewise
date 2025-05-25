import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';
import AuthContext from '../../context/AuthProvider';
import { Trash } from 'lucide-react';
import { PiStar, PiStarFill } from "react-icons/pi";

const Reviews = ({ reviewForId, reviewForType }) => {
    const { auth } = useContext(AuthContext);
    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [totalReviews, setTotalReviews] = useState(0);
    const [newReview, setNewReview] = useState({ content: '', rating: 0 });
    const [hoveredRating, setHoveredRating] = useState(0);

    const [loading, setLoading] = useState(false);

    const user = auth?.user;

    // Fetch existing reviews for the product
    const fetchReviews = async () => {
        if (loading) return;
        setLoading(true);

        try {
            const { data } = await axios.get('/reviews', {
                params: {
                    reviewForId,
                    reviewForType,
                    page,
                    limit: 5
                }
            });

            setReviews((prevReviews) => {
                const newReviews = data.reviews.filter(
                    (newReview) => !prevReviews.some((prevReview) => prevReview._id === newReview._id)
                );

                // Append only the unique reviews
                return [...prevReviews, ...newReviews];
            });
            setTotalReviews(data.totalReviews);
        } catch (error) {
            console.error('Error fetching reviews:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchReviews();
    }, [page]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewReview({ ...newReview, [name]: value });
    }

    const handleRatingChange = (rating) => {
        setNewReview((prevReview) => ({ ...prevReview, rating }));
    }

    const submitReview = async (e) => {
        e.preventDefault();

        if (loading) return;
        setLoading(true);

        // Add review only if user is logged in
        if (!user) {
            toast.error('Please log in to leave a review.');
            return;
        }

        try {
            await axios.post('/reviews', {
                ...newReview,
                typeId: reviewForId,
                type: reviewForType,
                user: user.id,
            });
            toast.success('Review submitted successfully!');
            setNewReview({ content: '', rating: 0 });
            fetchReviews();
        } catch (error) {
            console.error('Error submitting review:', error);
            toast.error('Failed to submit review.');
        } finally {
            setLoading(false);
        }
    }

    const deleteReview = async (reviewId) => {
        try {
            await axios.delete(`/reviews/${reviewId}`);
            setReviews(reviews.filter((review) => review._id !== reviewId));
            toast.success('Review deleted successfully');
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review. Please try again.')
        }
    }

    return (
        <div className="mt-6">

            {/* Review Submission Form */}
            {user && (
                <form onSubmit={submitReview} className="bg-white p-6 rounded-xl">
                    <h3 className="text-lg font-semibold mb-3">Leave a review</h3>
                    <div className="mb-4">
                        <label className="block font-medium mb-2">Rating</label>
                        <div className="flex items-center space-x-2">
                            {[1, 2, 3, 4, 5].map((rating) => (
                                <button
                                    key={rating}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(rating)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => handleRatingChange(rating)}
                                    className={"text-2xl transition"}
                                >
                                    {rating <= (hoveredRating || newReview.rating) && (newReview.rating !== 0 || hoveredRating !== 0
                                    )
                                        ? (<PiStarFill color='#FFBF00' />)
                                        : (<PiStar color='#B2BEB5' />)
                                    }
                                </button>
                            ))}
                        </div>

                    </div>
                    <div className="mb-4">
                        <label className="block font-medium mb-2">Comments</label>
                        <textarea
                            name="content"
                            value={newReview.content}
                            onChange={handleInputChange}
                            className="border p-2 rounded-xl w-1/2 focus:outline-none"
                            rows="4"
                        />
                    </div>
                    <button
                        type="submit"
                        className="bg-[#fc814a] text-white py-2 px-6 rounded-full hover:bg-[#fc5f18] transition-colors duration-300"
                    >
                        Submit
                    </button>
                </form>
            )
            }

            {/* Display Reviews */}
            <div className="flex flex-col p-6 gap-4">
                {reviews.map((review) => (
                    <div key={review._id} className="p-4 pb-5 bg-gray-50 rounded-lg border border-gray-200 flex justify-between">
                        <div className='flex flex-col items-start'>
                            <p className="font-semibold">{review.user.username}</p>
                            <p className="text-xs text-gray-500 mb-4">{new Date(review.createdAt).toLocaleDateString()}</p>
                            <p className='text-left'>{review.content}</p>
                        </div>
                        <div className='flex flex-col justify-between items-end w-20
                        '>
                            <p className="text-[#fc814a] text-left">{review.rating} / 5</p>
                            {user && review.user._id === user.id && (
                                <Trash onClick={() => deleteReview(review._id)} className='size-4 text-gray-800 hover:cursor-pointer' />
                            )}
                        </div>
                    </div>
                ))}

                {/* Load more button */}
                {reviews.length < totalReviews && (
                    <div className="mt-2">
                        <button
                            onClick={() => setPage(prevPage => prevPage + 1)}
                            disabled={loading}
                            className="text-[#fc814a] rounded-lg hover:underline"
                        >
                            {loading ? 'Loading...' : 'Load More'}
                        </button>
                    </div>
                )}
            </div>
        </div >
    )
}

export default Reviews;
