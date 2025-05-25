import axios from 'axios';
import { useContext, useEffect, useState } from 'react';
import AuthContext from '../../context/AuthProvider';
import { toast } from 'react-hot-toast';
import { Trash } from 'lucide-react';

const UserReviews = () => {
    const { auth } = useContext(AuthContext);
    const [userReviews, setUserReviews] = useState({
        productReviews: [],
        supplierReviews: [],
    });
    const [productOffset, setProductOffset] = useState(0);
    const [supplierOffset, setSupplierOffset] = useState(0);
    const [loading, setLoading] = useState(false);
    const [hasMoreProducts, setHasMoreProducts] = useState(true);
    const [hasMoreSuppliers, setHasMoreSuppliers] = useState(true);

    const limit = 5;
    const userId = auth?.user?.id;

    const getUserReviews = async (offset, type) => {
        try {
            setLoading(true);

            const response = await axios.get(`/reviews/user/${userId}?type=${type}&limit=${limit}&offset=${offset}`);

            const newReviews = response.data;

            setUserReviews((prevReviews) => ({
                ...prevReviews,
                [`${type}Reviews`]: [
                    ...prevReviews[`${type}Reviews`],
                    ...newReviews.filter(
                        (newReview) =>
                            !prevReviews[`${type}Reviews`].some(
                                (existingReview) => existingReview._id === newReview._id
                            )
                    ),
                ],
            }));

            if (newReviews.length < limit) {
                type === "product"
                    ? setHasMoreProducts(false)
                    : setHasMoreSuppliers(false);
            }

        } catch (error) {
            console.error(`Error fetching ${type} reviews:`, error);
            toast.error(`Failed to fetch ${type} reviews.`);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        if (auth?.user) {
            getUserReviews(0, "product");
            getUserReviews(0, "supplier");
        }
    }, [auth?.user])

    const loadMoreProducts = () => {
        getUserReviews(productOffset + limit, "product");
        setProductOffset((prevOffset) => prevOffset + limit);
    }

    const loadMoreSuppliers = () => {
        getUserReviews(supplierOffset + limit, "supplier");
        setSupplierOffset((prevOffset) => prevOffset + limit);
    }

    const deleteReview = async (reviewId, type) => {
        try {
            await axios.delete(`/reviews/${reviewId}`);
            setUserReviews((prevReviews) => ({
                ...prevReviews,
                [`${type}Reviews`]: prevReviews[`${type}Reviews`].filter(
                    (review) => review._id !== reviewId
                ),
            }));
            toast.success('Review deleted successfully');
        } catch (error) {
            console.error('Error deleting review:', error);
            toast.error('Failed to delete review. Please try again.')
        }
    }

    return (
        <div className='mt-6'>
            <h2 className='text-lg font-semibold mb-4 mx-4'>
                <strong>Your Reviews</strong>
            </h2>

            {/* Check if there are no reviews */}
            {(!userReviews?.productReviews?.length && !userReviews?.supplierReviews?.length) ? (
                <p className="text-gray-500 mx-2">You haven't made any reviews yet.</p>
            ) : (
                <div className='flex justify-evenly gap-7'>

                    {/* Product Reviews Section */}
                    {userReviews?.productReviews.length > 0 && (
                        <div className='w-full'>
                            <h3 className="text-md font-semibold mb-3 mx-4">
                                Product Reviews
                            </h3>
                            {userReviews.productReviews.map((review) => (
                                <div
                                    key={review._id}
                                    className="p-4 rounded-lg border mb-4 flex justify-between items-center"
                                >
                                    <div>
                                        <a
                                            href={`/products/${review.reviewFor.productId}`}
                                            className="text-lg font-semibold text-[#fc814a] hover:underline"
                                        >
                                            {review.reviewFor.name}
                                        </a>
                                        <p className="text-sm text-gray-600">
                                            Rating: {review.rating} / 5
                                        </p>
                                        <p className="mt-2">{review.content}</p>
                                    </div>
                                    <Trash
                                        onClick={() => deleteReview(review._id)}
                                        className="size-4 text-gray-800 hover:cursor-pointer"
                                    />
                                </div>
                            ))}
                            {hasMoreProducts && (
                                <button
                                    onClick={loadMoreProducts}
                                    className="text-sm text-[#fc814a] hover:underline"
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Supplier Reviews Section */}
                    {userReviews?.supplierReviews.length > 0 && (
                        <div className='w-full'>
                            <h3 className="text-md font-semibold mb-3 mx-4">
                                Supplier Reviews
                            </h3>
                            {userReviews.supplierReviews.map((review) => (
                                <div
                                    key={review._id}
                                    className="p-4 rounded-lg border mb-4 flex justify-between items-center"
                                >
                                    <div>
                                        <a
                                            href={`/suppliers/${review.reviewFor.supplierId}`}
                                            className="text-lg font-semibold text-[#fc814a] hover:underline"
                                        >
                                            {review.reviewFor.name}
                                        </a>
                                        <p className="text-sm text-gray-600">
                                            Rating: {review.rating} / 5
                                        </p>
                                        <p className="mt-2">{review.content}</p>
                                    </div>
                                    <Trash
                                        onClick={() => deleteReview(review._id)}
                                        className="size-4 text-gray-800 hover:cursor-pointer"
                                    />
                                </div>
                            ))}
                            {hasMoreSuppliers && (
                                <button
                                    onClick={loadMoreSuppliers}
                                    className="text-sm text-[#fc814a] hover:underline"
                                    disabled={loading}
                                >
                                    {loading ? "Loading..." : "Load More"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default UserReviews;