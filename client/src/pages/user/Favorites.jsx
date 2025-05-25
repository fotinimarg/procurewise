import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../../context/AuthProvider';
import ProductCard from '../../components/ProductCard';
import SupplierCard from '../../components/SupplierCard';

const Favorites = () => {
    const [favorites, setFavorites] = useState({ products: [], suppliers: [] });
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('products');
    const { auth } = useContext(AuthContext);

    const userId = auth?.user.id

    useEffect(() => {
        if (!userId) return;

        const fetchFavorites = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`/favorites/user/${userId}`);
                const { products, suppliers } = response.data;
                setFavorites({ products, suppliers });
            } catch (error) {
                console.error('Error fetching favorites:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchFavorites();
    }, [userId]);

    if (loading) return <div className="text-center mt-10">Loading...</div>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <h1 className="text-2xl font-semibold mb-4">My Favorites</h1>

            {/* Tabs Navigation */}
            <div className="flex justify-start border-b mb-4">
                <button
                    className={`px-4 py-2 ${activeTab === 'products' ? 'border-b-2 border-[#fc814a] font-semibold text-[#fc814a]' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('products')}
                >
                    Products
                </button>
                <button
                    className={`px-4 py-2 ${activeTab === 'suppliers' ? 'border-b-2 border-[#fc814a] font-semibold text-[#fc814a]' : 'text-gray-600'
                        }`}
                    onClick={() => setActiveTab('suppliers')}
                >
                    Suppliers
                </button>
            </div>

            {/* Favorites Products Section */}
            {activeTab === 'products' && (
                <section>
                    {favorites.products.length > 0 ? (
                        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center">
                            {favorites.products.map((product) => (
                                <ProductCard key={product.productDetails._id} product={product.productDetails} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No favorite products found.</p>
                    )}
                </section>
            )}

            {/* Favorites Suppliers Section */}
            {activeTab === 'suppliers' && (
                <section>
                    {favorites.suppliers.length > 0 ? (
                        <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))] justify-center">
                            {favorites.suppliers.map((supplier) => (
                                <SupplierCard key={supplier.supplierDetails._id} supplier={supplier.supplierDetails} />
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-600">No favorite suppliers found.</p>
                    )
                    }
                </section >
            )}
        </div >
    );
};

export default Favorites;
