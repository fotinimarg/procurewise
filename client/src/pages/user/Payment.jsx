import { useContext, useEffect, useState } from "react";
import CustomRadio from "../../components/CustomRadio";
import { Link, useNavigate } from "react-router-dom";
import { LiaLongArrowAltLeftSolid } from "react-icons/lia";
import CartContext from "../../../context/CartContext";
import axios from "axios";
import toast from 'react-hot-toast';

const Payment = () => {
    const { cart, fetchCart, setCart } = useContext(CartContext);
    const [paymentMethod, setPaymentMethod] = useState("Credit Card");
    const [loading, setLoading] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const loadCart = async () => {
            await fetchCart();
            if (!cart || cart?.groupedProducts?.length === 0) {
                navigate('/cart');
            }
            setLoading(false);
        };

        loadCart();
    }, []);

    const handlePayment = async (method) => {
        let total = 0;

        if (method === "Cash" && cart.shippingMethod !== "Store Pickup") {
            total = cart.subtotal + cart.shippingCost + 3;
        } else {
            total = cart.subtotal + cart.shippingCost;
        }

        try {
            const response = await axios.put('/order/payment', {
                orderId: cart._id,
                totalAmount: total,
                paymentMethod: method
            });
            setCart(prevCart => ({
                ...prevCart,
                paymentMethod: method,
                totalAmount: response.data.totalAmount,
            }));
        } catch (error) {
            console.error('Error updating payment method:', error);
        }
    }

    const placeOrder = async () => {
        setIsLoading(true);
        try {
            const response = await axios.post('/order/place', { cartId: cart._id });
            if (response.status === 200) {
                toast.success("Order placed successfully!");
                navigate(`/order/success/${response.data.order.orderId}`);
                setCart(null);
            }
        } catch (error) {
            if (error.response?.status === 400 && error.response.data?.issues) {
                const issues = error.response.data.issues;
                issues.forEach(issue => {
                    toast.warn(issue.message);
                });
                navigate('/cart');
            } else {
                toast.error("An unexpected error occurred. Please try again.");
            }
        } finally {
            setIsLoading(false);
        }
    }

    if (loading) return <div>Loading...</div>;

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            <div className="flex justify-between pr-3 items-center">
                <h1 className="text-2xl font-bold mb-4">Payment</h1>
                <Link to={'/cart'} className="flex items-center gap-1 text-[#fc814a] hover:underline">
                    <LiaLongArrowAltLeftSolid size={20} />
                    Back to Cart
                </Link>
            </div>
            {/* Payment Method Section */}
            <div className="container bg-white shadow-md rounded-xl p-6 flex justify-between gap-5 sm:flex-col lg:flex-row">
                <div className="w-full md:border-r md:pr-5">
                    <h2 className="text-lg font-semibold mb-4">Select a Payment Method</h2>
                    <div className="flex space-x-4">
                        {[
                            { id: 'credit-card', label: 'Credit Card' },
                            { id: 'paypal', label: 'PayPal' },
                            { id: 'cash-on-delivery', label: 'Cash' },
                        ].map((method) => (
                            <CustomRadio
                                key={method.id}
                                id={method.id}
                                name="paymentMethod"
                                value={method.label}
                                checked={paymentMethod === method.label}
                                onChange={() => {
                                    setPaymentMethod(method.label); handlePayment(method.label);
                                }}
                                label={`${method.label}`}
                            />
                        ))}
                    </div>
                </div>

                <div>
                    {/* Order Summary */}
                    <div className="m-4">
                        <h2 className="text-lg mb-4"><strong>Order Summary</strong></h2>
                        <div>
                            {cart?.groupedProducts.map((group) => (
                                <div key={group.supplier._id} className="mb-4 border-b">
                                    <h2 className="text-base font-bold">
                                        {group.supplier.name}
                                    </h2>
                                    <ul>
                                        {group?.products.map((orderProduct) => (
                                            <li key={orderProduct._id} className="mb-2">
                                                <div className="grid grid-cols-[3fr_1fr_1fr] items-center">
                                                    <p>{orderProduct?.productSupplier?.product.name}
                                                    </p>
                                                    <p className="text-center">
                                                        {orderProduct?.quantity}x
                                                    </p>
                                                    <p className="text-end">
                                                        {new Intl.NumberFormat('el', {
                                                            style: 'currency',
                                                            currency: 'EUR',
                                                        }).format(orderProduct?.productSupplier?.price)}
                                                    </p>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <p className="text-end">Subtotal: {new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(cart?.subtotal)}</p>
                        <p className="text-end mb-4">
                            Shipping Cost: {new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(cart?.shippingCost)}
                        </p>
                        <p className="text-end"><strong>Total:</strong> {new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(cart?.totalAmount)}</p>
                    </div>

                    {/* Place Order Button */}
                    <button
                        onClick={placeOrder}
                        disabled={isLoading}
                        className="w-full py-2 px-6 rounded-full bg-[#fc814a] hover:bg-[#fc5f18] text-white transition-colors duration-300"
                    >
                        {isLoading ? "Processing..." : paymentMethod === 'Cash' ? "Place Order" : "Pay"}
                    </button>
                </div>
            </div>
        </div>
    )
}
export default Payment;