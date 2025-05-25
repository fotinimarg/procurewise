import React, { useContext, useEffect, useState } from 'react'
import UserContext from '../../../context/userContext'
import axios from 'axios';
import OrderCard from '../../components/OrderCard'
import { Link, useNavigate } from 'react-router-dom';
import RecommendedProducts from '../../components/RecommendedProducts';

const Dashboard = () => {
    const { user } = useContext(UserContext);
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [recommendedProducts, setRecommendedProducts] = useState([]);

    useEffect(() => {
        const fetchRecommendations = async () => {
            try {
                const { data } = await axios.get('/products/recommendations');
                setRecommendedProducts(data.recommendations || []);
            } catch (err) {
                console.error('Error fetching recommendations', err);
            }
        };

        fetchRecommendations();
    }, []);

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

    const handleViewOrder = (orderId) => {
        navigate(`/order/${orderId}`);
    }

    if (loading) {
        return <div className="text-center mt-10">Loading...</div>;
    }

    return (
        <div className="p-6 max-w-screen-xl mx-auto space-y-8">
            {/* Welcome Header */}
            <header className="text-2xl font-semibold">
                Welcome back, <span className="text-[#fc814a]">{user.firstName}</span>!
            </header>

            {/* Active Orders */}
            {orders.some(order => order.status !== 'completed' && order.status !== 'cart') && (
                <section>
                    <h2 className="text-xl font-semibold mb-4">Active Orders</h2>
                    <div className="bg-white shadow-md rounded-xl">
                        <table className="table-auto w-full text-center border-collapse">
                            <thead className="bg-[#e8e8e8]">
                                <tr>
                                    <th className="px-4 py-2">Order ID</th>
                                    <th className="px-4 py-2">Date</th>
                                    <th className="px-4 py-2">Total Amount</th>
                                    <th className="px-4 py-2">Total Products</th>
                                    <th className="px-4 py-2">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.filter(order => order.status !== 'completed' && order.status !== 'cart').map((order) => (
                                    <tr key={order._id} className="border-t">
                                        <td className="px-4 py-2">
                                            <Link
                                                to={`/order/${order.orderId}`}
                                                className='hover:text-[#fc814a] transition-colors duration-300'>#{order.orderId}</Link>
                                        </td>
                                        <td className="px-4 py-2">{new Date(order.orderDate).toLocaleDateString()}</td>
                                        <td className="px-4 py-2">{new Intl.NumberFormat('el', {
                                            style: 'currency',
                                            currency: 'EUR',
                                        }).format(order.totalAmount)}</td>
                                        <td className="px-4 py-2">
                                            {order.groupedProducts.reduce((total, group) => {
                                                return total + group.products.reduce((subTotal, product) => subTotal + product.quantity, 0);
                                            }, 0)}
                                        </td>
                                        <td className="px-4 py-2">{order.status}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            )}

            {/* Recent Orders */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
                {orders.filter(order => order.status === 'completed')
                    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                    .slice(0, 3)
                    .length > 0 ? (
                    <div className='grid gap-2 grid-cols-[repeat(auto-fill,minmax(250px,1fr))] justify-center'>
                        {orders
                            .filter(order => order.status === 'completed')
                            .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate))
                            .slice(0, 3)
                            .map((order) => (
                                <OrderCard
                                    key={order._id}
                                    order={order}
                                    onViewOrder={(id) => handleViewOrder(id)}
                                    onReorder={(id) => handleReorder(id)}
                                    isCompleted={true}
                                />
                            ))}
                    </div>
                ) : (
                    <p className="text-gray-500 text-center">You have no completed orders yet.</p>
                )}
            </section>

            {/* Recommendations */}
            <section>
                <h2 className="text-xl font-semibold mb-4">Recommended for You</h2>
                <RecommendedProducts recommendedProducts={recommendedProducts} />
            </section>
        </div >
    )
}

export default Dashboard;