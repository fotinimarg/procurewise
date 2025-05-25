import { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import CartContext from '../../context/CartContext';
import { forwardRef } from 'react';

const CartPopup = forwardRef(({ isOpen, onClose }, ref) => {
    const { cart, fetchCart } = useContext(CartContext);
    const [cartItems, setCartItems] = useState([]);

    useEffect(() => {
        if (isOpen) {
            fetchCart();
        }
    }, [isOpen]);

    useEffect(() => {
        setCartItems(cart?.groupedProducts || []);
    }, [cart]);

    if (!isOpen) return null;

    return (
        <motion.div
            ref={ref}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 right-5 bg-white shadow-lg rounded-lg p-4 w-80 z-50"
        >
            <div className="flex justify-between items-center mb-3">
                <h2 className="text-lg font-semibold">Your Cart</h2>
                <button
                    onClick={onClose}
                    className="text-gray-500 hover:text-gray-700"
                >
                    ✕
                </button>
            </div>
            {cartItems.length > 0 ? (
                <ul className="space-y-3">
                    {cartItems.slice(0, 3).map((group) => (
                        <li
                            key={group.supplier._id}
                            className="flex flex-col items-center justify-between"
                        >
                            {group.products.map((item) => (
                                <div
                                    key={item._id}
                                    className="flex items-center justify-between mb-3 w-full px-2"
                                >
                                    <div>
                                        <p className="text-sm text-left font-medium">
                                            <Link
                                                to={`/products/${item.productSupplier.product.productId}`}
                                                onClick={onClose}
                                                className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                            >
                                                {item.productSupplier.product.name}
                                            </Link>
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {item.quantity} ×{' '}
                                            {new Intl.NumberFormat('el', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(item.productSupplier.price)}
                                        </p>
                                    </div>
                                    <img
                                        src={item.productSupplier.product.imageUrl}
                                        alt={item.productSupplier.product.name}
                                        className="w-12 h-12 rounded-md object-cover"
                                    />
                                </div>
                            ))}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-sm text-gray-500">Your cart is empty.</p>
            )}
            <div className="mt-6 flex justify-around">
                <Link
                    to="/cart"
                    onClick={onClose}
                    className="block text-center bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 px-6 rounded-full transition-colors duration-300"
                >
                    View Cart
                </Link>
                <Link
                    to={(!cart || cart?.groupedProducts?.length === 0) ? '/cart' : '/checkout'}
                    onClick={onClose}
                    className="block text-center bg-[#fc814a] hover:bg-[#fc5f18] text-white py-2 px-6 rounded-full transition-colors duration-300"
                >
                    Checkout
                </Link>
            </div>
        </motion.div>
    )
})

export default CartPopup;
