import axios from 'axios';
import React, { useEffect, useState } from 'react';
import OrderCard from '../../components/OrderCard';
import { useNavigate } from 'react-router-dom';

export default function Orders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('completed');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await axios.get('/order/user');
                setOrders(response.data);

            } catch (error) {
                console.error('Error fetching orders:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleViewOrder = (orderId) => {
        navigate(`/order/${orderId}`);
    }

    const handleReorder = async (orderId) => {
        try {
            const response = await axios.post(`/order/reorder/${orderId}`);

            if (response.status === 200) {
                window.location.href = '/cart';
            } else {
                console.error('Failed to reorder:', response.statusText);
            }
        } catch (error) {
            console.error('Error during reorder:', error.message);
        }
    }

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-screen-xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Orders</h1>

            {/* Tabs Navigation */}
            <div className="flex justify-start border-b mb-4">
                <button
                    className={`px-4 py-2 ${activeTab === 'completed' ? 'border-b-2 border-[#fc814a] font-semibold text-[#fc814a]' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('completed')}
                >
                    Completed
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'in-progress' ? 'border-b-2 border-[#fc814a] font-semibold text-[#fc814a]' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('in-progress')}
                >
                    In Progress
                </button>
            </div>

            {/* Completed Orders */}
            {activeTab === 'completed' && (
                <section>
                    {orders.filter(order => order.status === 'completed')
                        .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                        .slice(0, 4)
                        .length > 0 ? (
                        <div className='grid gap-2 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] justify-center'>
                            {orders
                                .filter(order => order.status === 'completed')
                                .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                                .slice(0, 4)
                                .map((order) => (
                                    <OrderCard
                                        key={order._id}
                                        order={order}
                                        onViewOrder={(orderId) => handleViewOrder(orderId)}
                                        onReorder={(id) => handleReorder(id)}
                                        isCompleted={true}
                                    />
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">You have no completed orders yet.</p>
                    )}
                </section>
            )}

            {/* In Progress */}
            {activeTab === 'in-progress' && (
                <section>
                    {orders.filter(order => order.status !== 'completed' && order.status !== 'cart').length > 0 ? (
                        <div className='grid gap-2 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] justify-center'>
                            {orders.filter(order => order.status !== 'completed' && order.status !== 'cart').map((order) => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onViewOrder={(orderId) => handleViewOrder(orderId)}
                                    onReorder={(id) => handleReorder(id)}
                                    isCompleted={false}
                                />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">You have no orders yet.</p>
                    )}
                </section>
            )}
        </div>
    )
}