import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/AuthProvider';
import { Link } from 'react-router-dom';

const MetricsSection = () => {
    const { auth } = useContext(AuthContext);
    const userId = auth?.user.id;

    const [metrics, setMetrics] = useState({
        ordersCount: 0,
        favoriteProductsCount: 0,
        favoriteSuppliersCount: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;

        const fetchMetrics = async () => {
            try {
                const [ordersResponse, favoritesResponse] = await Promise.all([
                    axios.get('/order/count'),
                    axios.get(`/favorites/user/${userId}`),
                ]);

                const { ordersCount } = ordersResponse.data;
                const { products, suppliers } = favoritesResponse.data;

                setMetrics({
                    ordersCount,
                    favoriteProductsCount: products.length,
                    favoriteSuppliersCount: suppliers.length,
                });
            } catch (error) {
                console.error('Error fetching metrics:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [userId]);

    if (loading) {
        return <div className="text-center mt-10">Loading metrics...</div>;
    }

    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Orders Count */}
            <Link
                to={'/order'}
                className="bg-white shadow-md rounded-xl p-4">
                <h3 className="text-lg font-medium text-gray-800">Orders</h3>
                <p className="text-2xl font-bold text-[#fc814a]">{metrics.ordersCount}</p>
            </Link>

            {/* Favorite Products Count */}
            <Link
                to={'/favorites'}
                className="bg-white shadow-md rounded-xl p-4">
                <h3 className="text-lg font-medium text-gray-800">Favorite Products</h3>
                <p className="text-2xl font-bold text-[#fc814a]">{metrics.favoriteProductsCount}</p>
            </Link>

            {/* Favorite Suppliers Count */}
            <Link
                to={'/favorites'}
                className="bg-white shadow-md rounded-xl p-4">
                <h3 className="text-lg font-medium text-gray-800">Favorite Suppliers</h3>
                <p className="text-2xl font-bold text-[#fc814a]">{metrics.favoriteSuppliersCount}</p>
            </Link>
        </div>
    );
};

export default MetricsSection;
