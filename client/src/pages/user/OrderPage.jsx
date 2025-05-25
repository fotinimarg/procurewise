import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import ViewSupplier from '../../components/ViewSupplier';
import { LiaLongArrowAltLeftSolid } from 'react-icons/lia';

const OrderPage = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [supplierId, setSupplierId] = useState(null);

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
            <div className="flex items-center justify-end p-3">
                <Link to={'/orders'} className="flex items-center gap-1 text-[#fc814a] hover:underline">
                    <LiaLongArrowAltLeftSolid size={20} />
                    Back to orders
                </Link>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md mb-8">
                <div className='flex justify-between'>
                    <div>
                        <h2 className="text-xl font-semibold text-gray-700">Order ID: {order.orderId}</h2>
                        <p className="text-lg text-gray-600 mb-8">
                            {new Date(order.orderDate).toLocaleDateString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-lg text-[#fc814a] font-bold mb-8">
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </p>
                    </div>
                </div>

                <div>
                    <ul className="space-y-4">
                        {order?.groupedProducts.map((group) => (
                            <li key={group.supplier._id} className="border-b pb-4">
                                <h2 className="text-base font-semibold text-gray-800 mb-2">
                                    <button
                                        onClick={() => setSupplierId(group.supplier._id)}>
                                        {group.supplier.name}
                                    </button>
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

                                <ul className="space-y-2">
                                    {group?.products.map((orderProduct) => (
                                        <li key={orderProduct._id} className="flex justify-between text-gray-600 items-center">
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
                    <div className='flex justify-between'>
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
                            {order.shippingMethod === 'Delivery' && order.paymentMethod === 'Cash' ? (
                                <p className="text-base font-semibold text-gray-800">Cash on Delivery:
                                    <span className='ml-1'>{new Intl.NumberFormat('el', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    }).format(3)}</span>
                                </p>
                            ) : (
                                <p className="text-base font-semibold text-gray-800">{order.paymentMethod}:
                                    <span className='ml-1'>{new Intl.NumberFormat('el', {
                                        style: 'currency',
                                        currency: 'EUR',
                                    }).format(0)}</span>
                                </p>
                            )}
                            <p className="text-lg font-semibold text-gray-800 mt-4">Total: <span className="text-lg">
                                {new Intl.NumberFormat('el', {
                                    style: 'currency',
                                    currency: 'EUR',
                                }).format(order.totalAmount)}</span></p>
                        </div>
                        <div>
                            {order.shippingMethod === 'Delivery' && (
                                <div className="pt-4 flex flex-col items-end">
                                    <p className="text-base font-semibold text-gray-800 flex gap-1">
                                        <span>
                                            {order?.shippingAddress.street},

                                        </span>
                                        <span>
                                            {order?.shippingAddress.city},
                                        </span>
                                        <span>
                                            {order?.shippingAddress.postalCode}
                                        </span>
                                    </p>
                                    <p className="text-base font-semibold text-gray-800 flex gap-1 text-center">
                                        <span>{order?.phoneNumber.number}</span>
                                    </p>
                                </div>
                            )}
                            {order?.coupon?.code && (
                                <p className="text-base font-semibold text-gray-800">Coupon:
                                    <span className='ml-1'>
                                        {order?.coupon?.code}
                                    </span>
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default OrderPage;
