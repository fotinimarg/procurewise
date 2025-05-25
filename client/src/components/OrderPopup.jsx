import { Link } from "react-router-dom";
import { Flag, Share } from 'lucide-react';
import axios from "axios";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const OrderPopup = ({ order, onClose }) => {
    if (!order) return null;

    const isDelivery = order.shippingMethod === "Delivery";
    const [isFlagged, setIsFlagged] = useState(order.isFlagged);
    const [adminNotes, setAdminNotes] = useState(order.adminNotes || '');
    const [shared, setShared] = useState(false);

    const flagOrderIssue = async (orderId, newFlagStatus) => {
        try {
            await axios.patch(`/order/${orderId}/admin/flag`, { isFlagged: newFlagStatus });
            setIsFlagged(newFlagStatus);
        } catch (error) {
            console.error('Error toggling flag:', error);
        }
    }

    useEffect(() => {
        const fetchSharedStatus = async () => {
            try {
                const response = await axios.get(`/order/shared-status/${order._id}`);
                if (response.data.shared) {
                    setShared(true);
                }
            } catch (error) {
                console.error('Error fetching shared status', error);
            }
        };

        fetchSharedStatus();
    }, [order._id]);

    const updateAdminNotes = async (orderId) => {
        try {
            await axios.patch(`/order/${orderId}/admin/notes`,
                { adminNotes });
        } catch (error) {
            console.error('Error updating notes:', error);
        }
    }

    const shareOrderToSuppliers = async () => {
        try {
            const response = await axios.post('/order/share-to-suppliers', {
                order,
            });

            if (response.status === 200) {
                setShared(true);
                toast.success('Order successfully shared to all suppliers!');
            } else {
                toast.error('Error sending orders to suppliers');
            }
        } catch (error) {
            console.error('Error sharing order to suppliers', error);
        }
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="relative bg-white rounded-xl shadow-lg p-6 w-[90%] max-w-3xl overflow-y-auto max-h-[90vh]">
                <button
                    className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                    onClick={onClose}>
                    ×
                </button>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Order Details</h2>
                    <div className="mr-6">
                        {/* Share button */}
                        <button
                            onClick={shared ? null : shareOrderToSuppliers}
                            className={`text-gray-600 hover:text-black transition-colors duration-300 ${shared ? 'text-gray-400 cursor-not-allowed' : 'hover:text-blue-500'}`}
                            disabled={shared}
                        >
                            <Share size={22} />
                        </button>
                    </div>
                </div>

                {/* Status */}
                <div className="flex gap-4 mb-4 items-center">
                    <button
                        onClick={() => flagOrderIssue(order.orderId, !isFlagged)}
                        className={`p-2 ${isFlagged ? 'text-red-600' : 'text-gray-500'}`}
                    >
                        <Flag size={20} fill={`${isFlagged ? 'red' : 'gray'}`} />
                    </button>
                    <p>
                        <strong>Order ID:</strong> {order.orderId}
                    </p>
                    <p>
                        <strong>Order Date:</strong> {new Date(order.orderDate).toLocaleString()}
                    </p>
                    <p>
                        <strong>Status:</strong> {order.status}
                    </p>
                </div>

                <div className="flex justify-between border-b">
                    {/* Customer Details */}
                    <div className="flex flex-col mb-4">
                        <h2 className="font-bold text-lg">Customer</h2>
                        <p>
                            <strong>Name:</strong> {order?.user?.firstName || "Deleted User"} {order?.user?.lastName || ""}
                        </p>
                        <p>
                            <strong>Email:</strong> {order?.user?.email || ""}
                        </p>
                        <p>
                            <strong>Phone:</strong> {order.phoneNumber?.number || ""}
                        </p>
                        {order.user !== null ? <a
                            href={`mailto:${order.user.email}`}
                            className="bg-[#fc814a] text-white text-center py-2 px-4 rounded-full hover:bg-[#fc5f18] mt-1 transition-colors duration-300">
                            Email Customer
                        </a> : ""}

                    </div>

                    {/* Delivery Details */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold">Shipping Method</h2>
                        {order.shippingMethod}

                        {isDelivery && (
                            <div className="flex flex-col">
                                <strong>Address:</strong>
                                <div>{order?.shippingAddress?.street}</div>
                                <div>{order?.shippingAddress?.city}, {order?.shippingAddress?.postalCode}</div>
                            </div>
                        )}
                    </div>

                    {/* Payment Details */}
                    <div className="mb-4">
                        <h2 className="text-lg font-bold">Payment Method</h2>
                        {order.paymentMethod}
                    </div>
                </div>

                {/* Products */}
                <div className="my-8">
                    <h2 className="text-lg font-bold">
                        Products
                    </h2>
                    <ul className="list-disc list-inside">
                        {order.groupedProducts.map((group, index) => (
                            <li key={index}>
                                <strong>Supplier:</strong> {group.supplier?.name} <br />
                                {group?.products.map((orderProduct) => (
                                    <div key={orderProduct._id} className="flex gap-5 text-gray-800 items-center mb-3">
                                        <div className="text-left flex gap-4 items-center">
                                            <img
                                                src={orderProduct.productSupplier.product.imageUrl}
                                                alt={orderProduct.productSupplier.product.name}
                                                className="w-12 h-12 rounded-md object-cover"
                                            />
                                            <h3 className="font-semibold">
                                                <Link
                                                    to={`/products/${orderProduct?.productSupplier?.product.productId}`}
                                                    className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                                >
                                                    {orderProduct?.productSupplier?.product?.name}
                                                </Link></h3>
                                        </div>
                                        <span>{orderProduct?.quantity} x {new Intl.NumberFormat('el', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        }).format(orderProduct?.priceAtOrderTime)}</span>
                                    </div>
                                ))}
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Total */}
                <p className="text-sm font-semibold">Subtotal:
                    <span className='ml-1'>{new Intl.NumberFormat('el', {
                        style: 'currency',
                        currency: 'EUR',
                    }).format(order.subtotal)}</span>
                </p>
                {order?.coupon?.discount && (
                    <div>
                        <strong>Coupon:</strong> {order.coupon.code} <br />
                        <strong>Discount:</strong> {new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(order.coupon.discount)}
                    </div>
                )}

                <p className="text-sm font-semibold">Shipping Cost:
                    <span className='ml-1'>{new Intl.NumberFormat('el', {
                        style: 'currency',
                        currency: 'EUR',
                    }).format(order.shippingCost)}</span>
                </p>
                {order.paymentMethod === 'Cash' && order.shippingMethod !== 'Store Pickup' && (
                    <p className="text-sm font-semibold">Cash on Delivery:
                        <span className='ml-1'>{new Intl.NumberFormat('el', {
                            style: 'currency',
                            currency: 'EUR',
                        }).format(3)}</span>
                    </p>
                )}
                <div className="flex gap-1 text-lg font-bold mb-6">
                    <p> Total Amount:</p>
                    {new Intl.NumberFormat('el', {
                        style: 'currency',
                        currency: 'EUR',
                    }).format(order.totalAmount)}
                </div>

                {/* Notes */}
                <div className="mb-4 border-t pt-6">
                    <strong>Admin Notes:</strong>
                    <textarea
                        rows="3"
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full border rounded-xl p-2 focus:outline-none"
                        placeholder="Add notes about this order..." />
                    <button
                        onClick={() => updateAdminNotes(order.orderId)}
                        className="px-4 py-1 bg-[#564256] hover:bg-[#392339] text-white rounded-xl transition-colors duration-300"
                    >
                        Save
                    </button>
                </div>

            </div>
        </div>
    );
}
export default OrderPopup;