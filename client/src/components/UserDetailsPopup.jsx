import { useEffect, useState } from "react";
import { UserRoundSearch } from "lucide-react";
import axios from "axios";
import { Card } from './Card'
import { Link } from "react-router-dom";

const UserDetailsPopup = ({ user, onClose }) => {
    const [recentOrders, setRecentOrders] = useState([]);
    const [recentFavs, setRecentFavs] = useState([]);

    useEffect(() => {
        const fetchRecentActions = async () => {
            const { data } = await axios.get(`/user/${user._id}/recent-actions`);
            setRecentOrders(data.recentOrders);
            setRecentFavs(data.recentFavs);
        }

        fetchRecentActions();
    }, []);

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
            <div className="bg-[#f3f4f6] p-6 rounded-xl shadow-lg w-auto relative max-h-[100vh] overflow-y-auto">
                <button
                    className='absolute top-0 right-2 text-gray-500 hover:text-gray-800'
                    onClick={onClose}>
                    ×
                </button>

                {/* Personal Information */}
                <div className="flex text-left gap-4">
                    <div className="flex flex-col items-center border-r pr-4">
                        <img src={user.profilePicture || '/default-avatar.png'} alt="Profile" className="w-20 h-20 rounded-full object-cover mb-5"
                            onError={(e) => {
                                e.target.src = '/default-avatar.png';
                            }}
                        />
                        <a
                            href={`mailto:${user.email}`}
                            className="bg-[#fc814a] text-white py-1 px-4 rounded-full hover:bg-[#fc5f18] transition-colors duration-300">
                            Email
                        </a>
                    </div>
                    <div className="border-r pr-4">
                        <p><strong>Full Name:</strong> {user.fullName}</p>
                        <p><strong>Username:</strong> {user.username}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p><strong>Business Name:</strong> {user.businessName}</p>
                        <p><strong>Role:</strong> {user.role}</p>
                        <p><strong>Status:</strong> {user.status}</p>
                    </div>
                    <div className="border-r pr-4">
                        <strong>Addresses:</strong>
                        {user.address.length > 0 ? (
                            <ul className="mt-2 list-disc ml-4">
                                {user.address.map((addr, index) => (
                                    <li key={index}>
                                        {addr.street}, {addr.city}, {addr.postalCode}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No addresses available</p>
                        )}
                    </div>
                    <div>
                        <strong>Phone Numbers:</strong>
                        {user.phoneNumber.length > 0 ? (
                            <ul className="mt-2 list-disc ml-4">
                                {user.phoneNumber.map((num, index) => (
                                    <li key={index}>
                                        {num.number}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p>No phone numbers available</p>
                        )}
                    </div>
                </div>

                {/* Recent Orders */}
                <h3 className="font-semibold text-lg border-t p-3 text-[#564256]">Recent Orders</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentOrders.map((order) => (
                        <Card key={order._id} className="text-left">
                            <p><strong>Order ID:</strong> {order.orderId}</p>
                            <p><strong>Order Date:</strong> {new Date(order.orderDate).toLocaleDateString()}</p>
                            <p><strong>Status:</strong> {order.status}</p>
                            <div className="text-left">
                                <strong>Products:</strong>
                                <ul className="text-center">
                                    {order.groupedProducts.map((group, index) => (
                                        <li key={index}>
                                            <strong>Supplier:</strong> {group.supplier.name}
                                            <ul>
                                                {group.products.map((product, idx) => (
                                                    <li key={idx}>
                                                        {product.productSupplier.product.name} - {product.quantity} x €{product.priceAtOrderTime}
                                                    </li>
                                                ))}
                                            </ul>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </Card>
                    ))}
                    <Link
                        to={`/admin/orders?user=${encodeURIComponent(user.username)}`}
                        className="flex items-center gap-1 text-[#fc814a] hover:underline">
                        View All Orders
                    </Link>
                </div>

                {/* Recent Favorites */}
                <h3 className="font-semibold text-lg p-3 text-[#564256]">Recent Favorites</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {recentFavs.map((favorite) => (
                        <Card key={favorite._id}>
                            <p><strong>Type:</strong> {favorite.favoriteType}</p>
                            <p><strong>Favorite: </strong>
                                <Link to={favorite.favoriteType === 'Product' ? `/products/${favorite.favoriteId.productId}` : `/suppliers/${favorite.favoriteId.supplierId}`} className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-200">
                                    {favorite.favoriteId.name}
                                </Link>
                            </p>
                        </Card>
                    ))}
                </div>
            </div>
        </div >
    );
};

const UserButton = ({ user }) => {
    const [showPopup, setShowPopup] = useState(false);

    return (
        <div>
            <button
                className="text-gray-500 hover:text-gray-800 transition-colors duration-300 mt-1"
                onClick={() => setShowPopup(true)}
            >
                <UserRoundSearch size={21} />
            </button>

            {showPopup && <UserDetailsPopup user={user} onClose={() => setShowPopup(false)} />}
        </div>
    );
};

export default UserButton;
