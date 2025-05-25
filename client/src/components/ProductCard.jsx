import React from 'react';
import FavoriteButton from './FavoriteButton';

const ProductCard = ({ product }) => {
    // Redirect to product page
    const handleView = (productId) => {
        window.location.href = `/products/${productId}`;
    }

    return (
        <div className="flex flex-col bg-white shadow-md rounded-xl overflow-hidden hover:shadow-lg transition-shadow duration-300 w-[210px] h-[360px] py-3 relative">
            <div className="p-2 h-3/5 overflow-hidden flex items-center justify-center">
                <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-contain hover:cursor-pointer"
                    onClick={() => handleView(product.productId)}
                />
                <div className="absolute top-1 right-1 rounded-full bg-white bg-opacity-80 p-2">
                    <FavoriteButton typeId={product._id} type="Product" size="small" />
                </div>
            </div>
            <div className="flex flex-col justify-between h-2/5 px-4">
                <div>
                    <h2 onClick={() => handleView(product.productId)} className="text-md font-semibold hover:cursor-pointer line-clamp-2">{product.name}</h2>
                    <p className="text-gray-600 text-sm mt-1 truncate">{product.description}</p>
                </div>
                <div className="flex items-center justify-between">
                    <span className="text-md font-bold text-gray-900">{new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(product.price)}</span>

                    { }
                    <button onClick={() => handleView(product.productId)} className="max-w-xs bg-[#fc814a] text-white py-2 px-4 rounded-full hover:bg-[#fc5f18] transition-colors duration-300">
                        View
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
