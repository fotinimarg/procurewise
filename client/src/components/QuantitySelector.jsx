import React, { useState } from 'react';

const QuantitySelector = ({ maxQuantity, onQuantityChange, initialQuantity = 1 }) => {
    const [quantity, setQuantity] = useState(initialQuantity);

    const handleQuantityChange = (change) => {
        const newQuantity = quantity + change;
        // Prevent going below 1 or exceeding maxQuantity
        if (newQuantity >= 1 && newQuantity <= maxQuantity) {
            setQuantity(newQuantity);
            onQuantityChange(newQuantity);
        }
    }

    return (
        <div className="flex items-center justify-center gap-1">
            <button
                onClick={() => handleQuantityChange(-1)}
                disabled={quantity <= 1}
                className="text-lg px-2 border rounded bg-gray-200"
            >
                -
            </button>
            <span className="mx-2 text-lg">{quantity}</span>
            <button
                onClick={() => handleQuantityChange(1)}
                disabled={quantity >= maxQuantity}
                className="text-lg px-2 border rounded bg-gray-200"
            >
                +
            </button>
        </div>
    )
}

export default QuantitySelector;