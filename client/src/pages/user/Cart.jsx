import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import { LiaLongArrowAltLeftSolid } from "react-icons/lia";
import { Link, useNavigate } from "react-router-dom";
import QuantitySelector from "../../components/QuantitySelector";
import CartContext from "../../../context/CartContext";
import ViewSupplier from "../../components/ViewSupplier"
import toast from "react-hot-toast";

const Cart = () => {
    const { cart, setCart, fetchCart } = useContext(CartContext);
    const [loading, setLoading] = useState(true);
    const [addCoupon, setAddCoupon] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [validationMessage, setValidationMessage] = useState('');
    const [error, setError] = useState('');
    const [supplierId, setSupplierId] = useState(null);
    const navigate = useNavigate();

    const loadCart = async () => {
        await fetchCart();
        setLoading(false);
    }

    useEffect(() => {
        loadCart();
    }, []);

    const updateQuantity = async (orderProductId, newQuantity) => {
        try {
            const { data } = await axios.put(`/cart/${orderProductId}`, {
                quantity: newQuantity,
            });

            loadCart();
        } catch (error) {
            console.error('Error updating quantity:', error);
        }
    }

    const validateCouponCode = async (code) => {
        try {
            const response = await axios.get(`/order/validate-coupon?code=${code}`);
            if (response.status === 200) {
                setValidationMessage('Coupon is valid!');
                return true;
            }
        } catch (err) {
            console.log(code)
            setValidationMessage('');
            setError('Invalid coupon code or expired.');
            return false;
        }
    }

    const handleCouponChange = (value) => {
        setCouponCode(value);
        setValidationMessage('');
        setError('');
    }

    const applyCoupon = async () => {
        // First validate the coupon code
        const isValid = await validateCouponCode(couponCode);

        if (!isValid) return;

        try {
            const response = await axios.post('/order/apply-coupon', {
                orderId: cart._id,
                code: couponCode,
            });

            if (response.status === 200) {
                loadCart();
                setError('');
                setValidationMessage('Coupon applied successfully!');
            }
        } catch (error) {
            if (error.response && error.response.data && error.response.data.error) {
                setError(error.response.data.error);
            } else {
                setError('Failed to apply coupon. Please try again.');
            }
            setValidationMessage('');
        }
    }

    const handleDelete = async (orderProductId) => {
        try {
            const { data } = await axios.delete(`/cart/${orderProductId}`);

            // Update the cart state after deletion
            setCart((prevCart) => {
                const updatedGroupedProducts = prevCart.groupedProducts.map((group) => ({
                    ...group,
                    products: group.products.filter(product => product._id !== orderProductId),
                })).filter(group => group.products.length > 0); // Remove empty groups

                return {
                    ...prevCart,
                    groupedProducts: updatedGroupedProducts,
                    subtotal: data.cart.subtotal,
                    totalAmount: data.cart.totalAmount,
                };
            });

            console.log('Product removed successfully');
            toast.success('Product removed successfully')
        } catch (error) {
            console.error('Error removing product from cart:', error);
        }
    }

    const handleCheckout = () => {
        navigate('/checkout');
    }

    if (loading) return <p>Loading...</p>;

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            <div className="flex justify-between pr-3 items-center">
                <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
                <Link to={'/'} className="flex items-center gap-1 text-[#fc814a] hover:underline">
                    <LiaLongArrowAltLeftSolid size={20} />
                    Continue Shopping
                </Link>
            </div>
            <div className="container bg-white shadow-md p-6 rounded-xl flex md:flex-row justify-between sm:flex-col sm:gap-5">
                <div className="md:w-3/4 border-r pr-6">
                    {(!cart || !cart?.groupedProducts || cart?.groupedProducts?.length === 0) ?
                        (<p>No items in cart.</p>) : (
                            <>
                                {/* Header row for cart items */}
                                <div className="grid grid-cols-[2fr_1fr_1fr_1fr_0.15fr] font-bold border-b pb-2 mb-3">
                                    <div>Product Details</div>
                                    <div className="text-center">Price</div>
                                    <div className="text-center">Quantity</div>
                                    <div className="text-center">Total</div>
                                    <div className="text-center"></div>
                                </div>
                                {cart?.groupedProducts.map((group) => (
                                    <div key={group.supplier._id} className="mb-4 border-b pb-2">
                                        <h2 className="text-base mb-2">
                                            Products from: <strong>
                                                <button
                                                    onClick={() => setSupplierId(group.supplier._id)}>
                                                    {group.supplier.name}
                                                </button>
                                            </strong>
                                        </h2>
                                        {supplierId === group.supplier._id && (
                                            <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'>
                                                <div className='bg-white rounded-lg shadow-lg p-6 relative w-96'>
                                                    <button
                                                        className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                                        onClick={() => setSupplierId(null)}>
                                                        ×
                                                    </button>
                                                    <ViewSupplier supplierId={group.supplier._id} />
                                                </div>
                                            </div>
                                        )}
                                        <ul>
                                            {group?.products.map((orderProduct) => (
                                                <li
                                                    key={orderProduct._id}
                                                    className="grid grid-cols-[2fr_1fr_1fr_1fr_0.15fr] items-center mb-2"
                                                >
                                                    {/* Product Details */}
                                                    <div className="text-left flex gap-4 items-center">
                                                        <img
                                                            src={orderProduct.productSupplier.product.imageUrl}
                                                            alt={orderProduct.productSupplier.product.name}
                                                            className="w-12 h-12 rounded-md object-cover"
                                                        />
                                                        <h3 className="text-lg font-semibold">
                                                            <Link
                                                                to={`/products/${orderProduct?.productSupplier?.product.productId}`}
                                                                className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                                            >
                                                                {orderProduct?.productSupplier?.product?.name}
                                                            </Link></h3>
                                                    </div>

                                                    {/* Price */}
                                                    <div className="text-center">
                                                        {new Intl.NumberFormat('el', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }).format(orderProduct?.productSupplier?.price)}
                                                    </div>

                                                    {/* Quantity */}
                                                    <div className="text-center">
                                                        <QuantitySelector
                                                            maxQuantity={orderProduct.productSupplier?.quantity}
                                                            initialQuantity={orderProduct.quantity}
                                                            onQuantityChange={(newQuantity) =>
                                                                updateQuantity(orderProduct._id, newQuantity)
                                                            }
                                                        />
                                                    </div>

                                                    {/* Total */}
                                                    <div className="text-center">
                                                        {new Intl.NumberFormat('el', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }).format(orderProduct.productSupplier?.price * orderProduct?.quantity)}
                                                    </div>

                                                    {/* Delete Button */}
                                                    <div className="text-center">
                                                        <button
                                                            onClick={() => handleDelete(orderProduct._id)}
                                                            className="text-red-500"
                                                        >
                                                            ✕
                                                        </button>
                                                    </div>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </>
                        )
                    }
                </div>

                {/* Summary */}
                <div className="md:w-1/4 p-6 bg-white rounded-xl rounded-l-none">
                    <h2 className="text-xl font-bold mb-6">Summary</h2>
                    <div className="flex flex-col justify-between gap-8">
                        <div>
                            {/* Subtotal */}
                            <p className="text-base mb-2 flex justify-between">
                                <span>Subtotal:</span> {new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(cart?.subtotal || 0)}
                            </p>

                            {/* Coupon Code */}
                            <div className="flex justify-between">
                                <label htmlFor="coupon" className="text-base">
                                    Coupon Code
                                </label>
                                <button
                                    onClick={() => setAddCoupon(!addCoupon)}
                                    className="text-[#fc814a] hover:underline">Add</button>
                            </div>

                            {addCoupon && (
                                <>
                                    <input
                                        id="coupon"
                                        type="text"
                                        placeholder="Enter your code"
                                        disabled={!cart || cart?.groupedProducts.length === 0}
                                        value={couponCode}
                                        onChange={(e) => handleCouponChange(e.target.value)}
                                        className="w-full mt-2 py-2 px-4 bg-gray-100 rounded-xl"
                                    />
                                    <button
                                        onClick={applyCoupon}
                                        disabled={!cart || cart?.groupedProducts.length === 0}
                                        className="mt-2 py-1 px-4 rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white transition-colors duration-300"
                                    >
                                        Apply
                                    </button>
                                </>
                            )}

                            {error ? (
                                <p className="text-red-500 mt-2">{error}</p>
                            ) : validationMessage ? (
                                <p className="text-green-500 mt-2">{validationMessage}</p>
                            ) : null}

                        </div>

                        {/* Total */}
                        <div>
                            <p className="text-lg font-semibold mb-4 flex justify-between">
                                <strong>Total:</strong> {new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(cart?.subtotal || 0)}
                            </p>

                            <button
                                onClick={handleCheckout}
                                disabled={!cart || !cart?.groupedProducts || cart?.groupedProducts?.length === 0}
                                className="w-full py-2 px-6 rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white transition-colors duration-300"
                            >
                                Checkout
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cart;