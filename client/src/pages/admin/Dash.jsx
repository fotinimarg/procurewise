import { useNavigate } from 'react-router-dom'
import { Card } from '../../components/Card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import { Users, ShoppingCart, Euro, View } from "lucide-react";
import OrderPopup from '../../components/OrderPopup';
import { useContext, useEffect, useState } from 'react'
import UserContext from '../../../context/userContext'
import axios from "axios";
import TopSuppliers from '../../components/TopSellingSups';
import NewUsers from '../../components/NewUsers';
import NewSuppliers from '../../components/NewSuppliers';

// Admin's Dashboard
const Dash = () => {
    const { user, loading } = useContext(UserContext);

    const [stats, setStats] = useState({
        totalOrders: 0,
        commissionPerMonth: [],
        inProgressOrders: null,
        newOrders: null,
        totalCommissions: 0,
        monthlySales: 0
    });
    const [topProducts, setTopProducts] = useState([]);
    const [activeUsers, setActiveUsers] = useState(0);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const navigate = useNavigate();

    useEffect(() => {
        const fetchTopProducts = async () => {
            try {
                const startDate = new Date();
                startDate.setMonth(startDate.getMonth() - 1);
                const response = await axios.get('/products/top-picks', {
                    params: { startDate: startDate.toISOString(), limit: 10 }
                });

                const formattedData = response.data.map(product => ({
                    name: product.name,
                    sales: product.totalSales
                }));

                setTopProducts(formattedData);
            } catch (error) {
                console.error("Error fetching top products:", error);
            }
        };

        fetchTopProducts();
    }, []);

    useEffect(() => {
        const fetchActiveUsersCount = async () => {
            try {
                const response = await axios.get('/user/admin/active-users-count');

                setActiveUsers(response.data.activeUsersCount);
            } catch (error) {
                console.error("Error fetching active users count:", error);
            }
        }

        fetchActiveUsersCount();
    }, []);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await axios.get('/order/admin/stats');

                const formattedCommissions = Array.from({ length: 12 }, (_, i) => ({
                    name: new Date(0, i).toLocaleString('default', { month: 'short' }),
                    commissions: response.data.commissionPerMonth.find(s => s.month === i + 1)?.totalCommissions || 0
                }));

                setStats(prev => ({ ...prev, ...response.data, commissionPerMonth: formattedCommissions }));
            } catch (error) {
                console.error("Error fetching stats:", error);
            }
        };

        fetchStats();
    }, []);

    const handleViewOrder = async (orderId) => {
        try {
            const response = await axios.get(`/order/${orderId}`);
            const orderDetails = response.data;
            setSelectedOrder(orderDetails);
            setIsPopupOpen(true);
        } catch (error) {
            console.error("Error fetching order details:", error);
        }
    }

    if (loading) {
        return <h1>Loading...</h1>
    }

    return (
        <div className='p-6 max-w-screen-xl mx-auto'>
            <header className="text-2xl font-semibold mb-4">
                Welcome back, <span className="text-[#fc814a]">{user.firstName}</span>!
            </header>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Key Stats */}
                <Card className="flex items-center gap-4 bg-white shadow-md">
                    <ShoppingCart size={24} className="text-blue-500" />
                    <div>
                        <h3 className="text-lg font-semibold">Total Orders</h3>
                        <p className="text-xl font-bold">{stats.totalOrders}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-white shadow-md">
                    <Users size={24} className="text-rose-600" />
                    <div>
                        <h3 className="text-lg font-semibold">Active Users</h3>
                        <p className="text-xl font-bold">{activeUsers}</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-white shadow-md">
                    <Euro size={24} className="text-yellow-500" />
                    <div>
                        <h3 className="text-lg font-semibold">Monthly Sales</h3>
                        <p className="text-xl font-bold">{stats.monthlySales.toFixed(2)}€</p>
                    </div>
                </Card>
                <Card className="flex items-center gap-4 bg-white shadow-md">
                    <Euro size={24} className="text-lime-600" />
                    <div>
                        <h3 className="text-lg font-semibold">Monthly Revenue</h3>
                        <p className="text-xl font-bold">{stats.totalCommissions.toFixed(2)}€</p>
                    </div>
                </Card>

                {/* Commissions Chart */}
                <Card className="col-span-2 bg-white shadow-md">
                    <h3 className="text-lg font-semibold mb-3">Commissions Overview</h3>
                    <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={stats.commissionPerMonth}>
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Line type="monotone" dataKey="commissions" stroke="#8884d8" />
                        </LineChart>
                    </ResponsiveContainer>
                </Card>

                {/* Top Products */}
                <Card className="col-span-2 bg-white shadow-md">
                    <h3 className="text-lg font-semibold">Top Selling Products</h3>
                    <h4 className="font-semibold mb-3">Last 30 days</h4>
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart data={topProducts} margin={{ bottom: 80 }}>
                            <XAxis
                                dataKey="name"
                                tickSize={25}
                                interval={0}
                                tick={({ x, y, payload }) => {
                                    const words = payload.value.split(' ');
                                    const lines = [];
                                    let line = '';

                                    words.forEach((word) => {
                                        if ((line + word).length > 10) {
                                            lines.push(line);
                                            line = word;
                                        } else {
                                            line += (line.length ? ' ' : '') + word;
                                        }
                                    });
                                    lines.push(line);

                                    return (
                                        <text
                                            x={x}
                                            y={y + 10}
                                            textAnchor="middle"
                                            fontSize={12}
                                            fill="#333"
                                            transform={`rotate(-30, ${x}, ${y})`}
                                        >
                                            {lines.map((line, index) => (
                                                <tspan x={x} dy={index === 0 ? 0 : 13} key={index}>{line}</tspan>
                                            ))}
                                        </text>
                                    );
                                }}
                            />
                            <YAxis
                                allowDecimals={false}
                                tickFormatter={(value) => Math.round(value)}
                                domain={[0, 'dataMax']}
                            />
                            <Tooltip />
                            <CartesianGrid strokeDasharray="3 3" />
                            <Bar dataKey="sales" fill="#4CAF50" />
                        </BarChart>
                    </ResponsiveContainer>
                </Card>

                {/* New Orders */}
                <Card className="col-span-2 bg-white shadow-md p-4 flex flex-col">
                    <h3 className="text-lg font-semibold mb-3">New Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className='bg-[#e8e8e8]'>
                                <tr>
                                    <th className="px-4 py-2 text-left">Order ID</th>
                                    <th className="px-4 py-2 text-left">Customer</th>
                                    <th className="px-4 py-2 text-left">Total Amount</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className='px-4 py-2'>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.newOrders && stats.newOrders.length > 0 ? (stats.newOrders.map(order => (
                                    <tr key={order._id} className="border-t">
                                        <td className="px-4 py-2">{order.orderId}</td>
                                        <td className="px-4 py-2">{order.userInfo.username}</td>
                                        <td className="px-4 py-2">{order.totalAmount} €</td>
                                        <td className="px-4 py-2">{order.status}</td>
                                        <td className="py-2 text-center">
                                            <button
                                                onClick={() => handleViewOrder(order.orderId)}
                                                className="px-4 py-1 border-gray-300 text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-300"
                                            >
                                                <View />
                                            </button>
                                        </td>
                                    </tr>
                                ))) : (
                                    <tr>
                                        <td className="py-2 text-center text-gray-500">
                                            No new orders.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* In-Progress Orders */}
                <Card className="col-span-2 bg-white shadow-md p-4 flex flex-col">
                    <h3 className="text-lg font-semibold mb-3">In-Progress Orders</h3>
                    <div className="overflow-x-auto">
                        <table className="min-w-full table-auto">
                            <thead className='bg-[#e8e8e8]'>
                                <tr>
                                    <th className="px-4 py-2 text-left">Order ID</th>
                                    <th className="px-4 py-2 text-left">Customer</th>
                                    <th className="px-4 py-2 text-left">Total Amount</th>
                                    <th className="px-4 py-2 text-left">Status</th>
                                    <th className='px-4 py-2'>View</th>
                                </tr>
                            </thead>
                            <tbody>
                                {stats.inProgressOrders && stats.inProgressOrders.length > 0 ? (stats.inProgressOrders.map(order => (
                                    <tr key={order._id} className="border-t">
                                        <td className="px-4 py-2">{order.orderId}</td>
                                        <td className="px-4 py-2">{order.userInfo.username}</td>
                                        <td className="px-4 py-2">{order.totalAmount} €</td>
                                        <td className="px-4 py-2">{order.status}</td>
                                        <td className="py-2 text-center">
                                            <button
                                                onClick={() => handleViewOrder(order.orderId)}
                                                className="px-4 py-1 border-gray-300 text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-300"
                                            >
                                                <View />
                                            </button>
                                        </td>
                                    </tr>
                                ))) : (
                                    <tr>
                                        <td className="py-2 text-center text-gray-500">
                                            No new orders.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>
            </div>

            {/* Order Popup */}
            {isPopupOpen && (
                <OrderPopup
                    order={selectedOrder}
                    onClose={() => setIsPopupOpen(false)}
                />
            )}

            <div className="flex justify-end mt-3">
                <button
                    onClick={() => navigate('/admin/orders')}
                    className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-300"
                >
                    View All Orders →
                </button>
            </div>

            <TopSuppliers />

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                <Card className="col-span-2 bg-white shadow-md">
                    <NewUsers />
                </Card>

                <Card className="col-span-2 bg-white shadow-md">
                    <NewSuppliers />
                </Card>
            </div>
        </div>
    )
}

export default Dash