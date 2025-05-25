import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import SupplierCard from '../components/SupplierCard';
import Pagination from '../components/Pagination';

const SearchResults = () => {
    const [loading, setLoading] = useState(true);
    const [searchResults, setSearchResults] = useState({ products: [], suppliers: [] });

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    // Get the search query from the URL
    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const searchQuery = searchParams.get('query') || '';

    useEffect(() => {
        const fetchSearchResults = async () => {
            setLoading(true);
            try {
                const response = await axios.get(`/search`, {
                    params: {
                        q: searchQuery,
                        page: currentPage,
                        limit: itemsPerPage
                    }
                });

                setSearchResults(response.data);
                setTotalPages(Math.max(response.data.totalPages.products, response.data.totalPages.suppliers));
            } catch (err) {
                console.error('Error fetching results:', err);
            } finally {
                setLoading(false);
            }
        };

        if (searchQuery) {
            fetchSearchResults();
        }
    }, [searchQuery, currentPage]);

    if (loading) return <div className='text-center'>Loading products...</div>;

    return (
        <div className='p-6 max-w-screen-xl mx-auto'>
            {searchResults.products.length > 0 || searchResults.suppliers.length > 0 ? (
                <div>
                    <h2 className='text-xl font-semibold text-gray-900 mb-4'>Search results for: {`${searchQuery}`}</h2>
                    <div className='flex flex-col gap-6'>

                        {searchResults.suppliers.length > 0 ? (
                            <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(190px,1fr))] justify-center">
                                {searchResults.suppliers.map(supplier => (
                                    <SupplierCard key={supplier._id} supplier={supplier} />
                                ))}
                            </div>
                        ) : (
                            ''
                        )}
                        {searchResults.products.length > 0 ? (
                            <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(205px,1fr))] justify-center">
                                {searchResults.products.map(product => (
                                    <ProductCard key={product._id} product={product} />
                                ))}
                            </div>
                        ) : (
                            ''
                        )}
                    </div>

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            ) :
                <h2 className='text-xl text-gray-900 mb-4'>
                    No results for {`${searchQuery}`}
                </h2>
            }
        </div>
    );
}

export default SearchResults;