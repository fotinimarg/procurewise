import React, { useEffect, useState } from 'react';
import axios from 'axios';

const Rating = ({ itemId, itemType }) => {
    const [rating, setRating] = useState(0);

    useEffect(() => {
        const fetchRating = async () => {
            try {
                const response = await axios.get(`/${itemType}s/${itemId}/rating`);
                const fetchedRating = response.data.rating;
                if (fetchedRating > 0) {
                    setRating(fetchedRating);
                }
            } catch (error) {
                console.log("Error fetching rating:", error);
            }
        };

        fetchRating();
    }, [itemId, itemType]);

    const renderStars = () => {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const quarterStar = (rating % 1) >= 0.25 && !halfStar;
        const emptyStars = (5 - fullStars - (halfStar ? 1 : 0) - (quarterStar ? 1 : 0));

        return (
            <>
                {/* Full star */}
                {Array(fullStars).fill().map((_, index) => (
                    <span key={`full-${index}`}>&#9733;</span>
                ))}
                {/* Half Star */}
                {halfStar && (
                    <span key='half' className="relative inline-block">
                        <span className="absolute overflow-hidden w-1/2">&#9733;</span>
                        <span className="text-gray-300">&#9733;</span>
                    </span>)}
                {/* Quarter Star */}
                {quarterStar && (
                    <span key='quarter' className="relative inline-block">
                        <span className="absolute overflow-hidden w-1/4">&#9733;</span>
                        <span className="text-gray-300">&#9733;</span>
                    </span>)}
                {/* Empty star */}
                {Array(emptyStars).fill().map((_, index) => (
                    <span key={`empty-${index}`}>&#9734;</span>
                ))}
            </>
        );
    };

    return (
        rating > 0 ? (
            <div className="rating-stars text-yellow-500 flex items-center text-xl hover:cursor-pointer">
                {renderStars()}
                <p className='ml-1 text-sm'>{rating}</p>
            </div>
        ) : null
    );
};

export default Rating;