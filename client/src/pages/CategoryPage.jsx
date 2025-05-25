import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useLocation, useParams } from 'react-router-dom';
import Breadcrumb from '../components/Breadcrumb';
import ProductCard from '../components/ProductCard';
import TopSellingCarousel from '../components/TopSellingCarousel';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/FilterSidebar';

const CategoryPage = () => {
    const location = useLocation();
    const { categoryId } = location.state || {};
    const { categorySlug } = useParams();

    const [category, setCategory] = useState(null);
    const [products, setProducts] = useState([]);

    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({
        specifications: {}
    });

    const openFilter = () => setIsFilterOpen(true);
    const closeFilter = async () => {
        setIsFilterOpen(false);
    };

    const cancelFilter = async () => {
        const emptyFilters = { specifications: {} };
        setSelectedFilters(emptyFilters);
        await fetchProducts(categoryId, 1, emptyFilters);
        setIsFilterOpen(false);
    };

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 20;

    useEffect(() => {
        const fetchCategory = async () => {
            try {
                let categoryData;
                if (categoryId) {
                    const response = await axios.get(`/categories/${categoryId}`);
                    categoryData = response.data;
                } else {
                    const response = await axios.get(`/categories/category/slug?slug=${categorySlug}`);
                    categoryData = response.data;
                }
                setCategory(categoryData);

                if (categoryData.subcategories.length === 0) {
                    fetchProducts(categoryData._id, currentPage, selectedFilters);
                }
            } catch (error) {
                console.error('Error fetching category data:', error);
            }
        };

        fetchCategory();
    }, [categoryId, categorySlug, currentPage]);

    const fetchProducts = async (categoryId, page, selectedFilters) => {
        try {
            const params = {
                category: categoryId,
                page,
                limit: itemsPerPage,
            };

            // Add price filters if they exist
            if (selectedFilters.minPrice) {
                params.minPrice = selectedFilters.minPrice;
            }
            if (selectedFilters.maxPrice) {
                params.maxPrice = selectedFilters.maxPrice;
            }

            // Add specifications filters if they exist
            if (selectedFilters.specifications && Object.keys(selectedFilters.specifications).length > 0) {
                params.specifications = JSON.stringify(selectedFilters.specifications);
            }

            const response = await axios.get(`/products`, { params });

            setProducts(response.data.products);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    const applyFilters = () => {
        fetchProducts(categoryId, 1, selectedFilters);
        setIsFilterOpen(false);
    }

    if (!category) return <p className='text-center'>Loading...</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <Breadcrumb />
            <h1 className='text-center font-bold text-2xl mt-4 mb-6'>{category.name}</h1>

            {category.subcategories && category.subcategories.length > 0 && (
                <div className='grid gap-4 grid-cols-[repeat(auto-fill,minmax(250px,1fr))]'>
                    {category.subcategories.map((subcategory) => (
                        <Link
                            key={subcategory._id}
                            to={
                                `/categories/${subcategory.slug}`
                            }
                            state={{ categoryId: subcategory._id }}
                            className="relative">
                            <div className="bg-white shadow-md rounded-xl hover:shadow-lg transition-shadow duration-300 max-w-sm text-gray-900 font-semibold text-xl text-center">
                                <div className="relative w-full h-48 group">
                                    <img
                                        src={subcategory.imageUrl}
                                        alt={subcategory.name}
                                        className="absolute inset-0 w-full h-full object-cover rounded-xl opacity-75 transition-opacity duration-300 group-hover:opacity-80"
                                    />
                                    <div className="absolute inset-0 bg-black opacity-30 rounded-xl transition-opacity duration-300 group-hover:opacity-50"></div>
                                    <div className="absolute inset-0 flex items-center justify-center text-white text-2xl font-semibold z-10">
                                        {subcategory.name}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Display Products */}
            {(!category.subcategories || category.subcategories.length === 0) && (
                <div>
                    {products.length > 0 ? (
                        <div>
                            {/* Button to open the filter sidebar */}
                            <button onClick={openFilter} className="bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 ml-auto">
                                Filters
                            </button>

                            {/* Filter Sidebar */}
                            <FilterSidebar products={products} isOpen={isFilterOpen} onClose={closeFilter} onCancel={cancelFilter} selectedFilters={selectedFilters}
                                setSelectedFilters={setSelectedFilters} onApplyFilters={applyFilters} />

                            {/* Top Selling Products */}
                            {(Object.keys(selectedFilters.specifications).length === 0 && !selectedFilters.minPrice && !selectedFilters.maxPrice) && (
                                <TopSellingCarousel categoryId={category._id} />
                            )}


                            {/* All Products */}
                            <h2 className="text-xl font-semibold my-3 text-gray-800">All Products</h2>
                            <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(200px,1fr))]">
                                {products.map((product) => (
                                    <div key={product._id}>
                                        <ProductCard product={product} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-center text-gray-500">No products found in this category.</p>
                    )}

                    {/* Pagination */}
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
            )}
        </div>
    );
}

export default CategoryPage;