import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const OrderSuccess = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await axios.get(`/order/${orderId}`);
                setOrder(response.data);
            } catch (error) {
                console.error("Error fetching order details:", error);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    if (!order) {
        return <div>Loading...</div>;
    }

    return (
        <div className="max-w-screen-xl mx-auto p-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-800 mb-2">Thank you for your order!</h1>
                <p className="text-lg text-gray-600">Your order is being reviewed and will be processed shortly.</p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
                <h2 className="text-xl font-semibold text-gray-700 mb-2">Order ID: {order.orderId}</h2>
                <p className="text-lg text-gray-600 mb-8">Order Date: {new Date(order.orderDate).toLocaleDateString()}</p>

                <div className="bg-[#e8e8e8] p-6 rounded-lg mb-8">
                    <p className="text-lg text-gray-600 text-center">You'll receive a confirmation email soon. If you have any questions, feel free to contact us.</p>
                </div>

                <div>
                    <h3 className="text-xl font-semibold text-gray-700 mb-4">Order Summary</h3>
                    <ul className="space-y-4">
                        {order?.groupedProducts.map((group) => (
                            <li key={group.supplier._id} className="border-b pb-4">
                                <h4 className="text-lg font-semibold text-gray-700 mb-2">{group.supplier.name}</h4>
                                <ul className="space-y-2">
                                    {group?.products.map((orderProduct) => (
                                        <li key={orderProduct._id} className="flex justify-between text-gray-600">
                                            <span>{orderProduct?.productSupplier?.product?.name}</span>
                                            <span>{orderProduct?.quantity} x {new Intl.NumberFormat('el', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(orderProduct?.productSupplier?.price)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                    <div className="pt-4">
                        <p className="text-base font-semibold text-gray-800">Subtotal:
                            <span className='ml-1'>{new Intl.NumberFormat('el', {
                                style: 'currency',
                                currency: 'EUR',
                            }).format(order.subtotal)}</span>
                        </p>
                        <p className="text-base font-semibold text-gray-800">Shipping Cost:
                            <span className='ml-1'>{new Intl.NumberFormat('el', {
                                style: 'currency',
                                currency: 'EUR',
                            }).format(order.shippingCost)}</span>
                        </p>
                        {order.shippingMethod === 'Delivery' && order.paymentMethod === 'Cash' && (
                            <p className="text-base font-semibold text-gray-800">Cash on Delivery:
                                <span className='ml-1'>{new Intl.NumberFormat('el', {
                                    style: 'currency',
                                    currency: 'EUR',
                                }).format(3)}</span>
                            </p>
                        )}
                        <p className="text-lg font-semibold text-gray-800 mt-4">Total: <span className="text-lg">
                            {new Intl.NumberFormat('el', {
                                style: 'currency',
                                currency: 'EUR',
                            }).format(order.totalAmount)}</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderSuccess;