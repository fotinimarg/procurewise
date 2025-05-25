import { Link, useNavigate } from 'react-router-dom';

const AddToCartOrEdit = ({ inStock, onClick, isAdmin, productId }) => {
    const navigate = useNavigate();

    const handleClick = () => {
        if (isAdmin) {
            // Redirect to the edit product page if admin
            navigate(`/admin/products?productId=${productId}`);
        } else {
            onClick();
        }
    }

    return (
        <div className='flex flex-col items-center gap-1'>
            <button
                onClick={handleClick}
                disabled={!isAdmin && !inStock} // Only disable if not admin and out of stock
                className={`mt-auto px-10 lg:px-40 py-2 rounded-full transition-colors duration-300 ${isAdmin
                    ? 'bg-[#fc814a] text-white hover:bg-[#fc5f18] transition-colors duration-300'
                    : inStock
                        ? 'bg-[#fc814a] text-white hover:bg-[#fc5f18] transition-colors duration-300'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed transition-colors duration-300'
                    }`}
            >
                {isAdmin ? 'Edit Product' : inStock ? 'Add to Cart' : 'Out of Stock'}
            </button>
            {isAdmin && (
                <Link to="/admin/products" className="text-[#fc814a] hover:underline ">
                    All Products
                </Link>
            )}
        </div>
    );
};

export default AddToCartOrEdit;
