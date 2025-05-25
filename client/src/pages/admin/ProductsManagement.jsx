import React, { useEffect, useState, useRef } from 'react';
import { Link, useSearchParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import AddProduct from '../../components/AddProduct';
import EditProduct from './EditProduct';
import { Trash2, Pencil, PlusCircle, Share, SquarePen, Filter } from 'lucide-react';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Pagination from '../../components/Pagination';
import ConfirmationModal from "../../components/ConfirmationModal";
import CategoryFilterDropdown from '../../components/CategoryFilterDropdown';

const ProductsManagement = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newToggle, setNewToggle] = useState(false);
    const [editId, setEditId] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [exportOptions, setExportOptions] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const dropdownRef = useRef(null);
    const dropdownRefExp = useRef(null);
    const dropdownRefFil = useRef(null);
    const buttonRef = useRef(null);
    const exportRef = useRef(null);
    const filterRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const itemsPerPage = 20;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });
    const [modalMessage, setModalMessage] = useState("");

    const [selectedCategoryName, setSelectedCategoryName] = useState(null);
    const productId = searchParams.get("productId");

    // Fetch products from the backend
    const fetchProducts = async (categoryName = null, page = 1, limit = itemsPerPage) => {
        try {
            const response = await axios.get('/products/admin',
                {
                    params: { categoryName, startDate, endDate, page, limit, searchQuery: debouncedSearchQuery }
                }
            );
            setProducts(response.data.products);
            setTotalProducts(response.data.totalProducts);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts(null, currentPage, itemsPerPage);
    }, [currentPage])

    useEffect(() => {
        if (location.state?.parentSearchQuery) {
            setSearchQuery(location.state.parentSearchQuery);
        }
    }, [location.state])

    const handleCategoryChange = (categoryId, categoryName) => {
        setSelectedCategoryName(categoryName);
    }

    useEffect(() => {
        setCurrentPage(1);
        fetchProducts(null, 1, itemsPerPage);
    }, [debouncedSearchQuery, productId]);

    // Update search query after user stops typing
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 800);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    }

    // Bulk Delete Action
    const handleOpenBulkModal = () => {
        if (selectedProducts.length === 0) {
            toast.error("No products selected for deletion.");
            return;
        }
        setConfirmAction(() => handleBulkDelete);
        setModalMessage(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`);
        setIsModalOpen(true);
    }

    // Single Delete Action
    const handleOpenModal = (id) => {
        setConfirmAction(() => () => handleDelete(id));
        setModalMessage("Are you sure you want to delete this product?");
        setIsModalOpen(true);
    }

    // Delete product handler
    const handleDelete = async (productId) => {
        try {
            await axios.delete(`/products/${productId}`);
            setProducts(products.filter((product) => product._id !== productId));

            fetchProducts();
            toast.success('Product deleted successfully');
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    }

    //Toggle edit form visibility
    const handleEdit = (productId) => {
        setEditId(productId);
    }

    // Toggle new product form visibility
    const handleNewClick = () => {
        setNewToggle(!newToggle);
        fetchProducts();
    }

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchProducts(selectedCategoryName, 1, itemsPerPage);
        setShowFilters(false);
    }

    const resetFilters = () => {
        setSelectedCategoryName("");
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    }

    // Toggle product selection
    const handleProductSelection = (productId) => {
        setSelectedProducts((prev) =>
            prev.includes(productId)
                ? prev.filter((id) => id !== productId)
                : [...prev, productId]
        );
    }

    // Select/Deselect all products
    const handleSelectAll = () => {
        if (selectedProducts.length === products.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(products.map((product) => product._id));
        }

    }

    // Close the dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                buttonRef.current && !buttonRef.current.contains(event.target)
            ) {
                setShowBulkActions(false);
            }
            if (
                dropdownRefExp.current && !dropdownRefExp.current.contains(event.target) && exportRef.current && !exportRef.current.contains(event.target)
            ) {
                setExportOptions(false);
            }
            if (
                dropdownRefFil.current && !dropdownRefFil.current.contains(event.target) && filterRef.current && !filterRef.current.contains(event.target)
            ) {
                setShowFilters(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Bulk delete selected products
    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            toast.error("No products selected for deletion.");
            return;
        }

        setIsModalOpen(false);

        try {
            const response = await axios.delete('/products/admin/bulk-delete', { data: { productIds: selectedProducts } });

            setProducts(products.filter((product) => !selectedProducts.includes(product._id)));

            setSelectedProducts([]);
            deletedCount = response.deletedCount
            toast.success(`${deletedCount} products deleted successfully!`);
        } catch (error) {
            console.error("Error deleting products:", error);
            toast.error("Failed to delete products.");
        }
    }

    const exportProductsToCSV = async (selectedProductIds, exportType) => {
        try {
            if (exportType === 'selected' && selectedProductIds.length === 0) {
                toast.error('No selected products.');
                return;
            }

            const response = await axios.post('/products/admin/export-products',
                {
                    productIds: selectedProductIds,
                    exportType,
                    searchQuery,
                    startDate,
                    endDate,
                    currentPage,
                    itemsPerPage,
                    categoryName: selectedCategoryName
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'products.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting products:', error);
            toast.error('Failed to export products.');
        }
    }

    if (loading) return <p className='text-center mt-5'>Loading products...</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <div className='flex flex-col justify-between relative mb-3'>
                <h1 className="text-2xl font-semibold mb-4">Products Management</h1>
                <div className='flex justify-between items-end relative'>
                    <div className='flex gap-4 -mb-2 ml-1'>
                        <div className='relative'>
                            <button
                                ref={buttonRef}
                                className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-200"
                                onClick={() => setShowBulkActions(!showBulkActions)}
                            >
                                <SquarePen />
                            </button>

                            <AnimatePresence>
                                {showBulkActions && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        ref={dropdownRef}
                                        className="absolute left-0 ml-10 mt-[-40px] w-48 bg-white rounded-xl shadow-lg z-50 py-1"
                                    >
                                        <button
                                            onClick={handleOpenBulkModal}
                                            className="flex items-start w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200"
                                        >
                                            <Trash2 size={16} />
                                            Bulk Delete
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className='relative'>
                            <button
                                ref={exportRef}
                                onClick={() => setExportOptions(!exportOptions)}
                                className="text-[#fc814a] hover:text-[#fc5f18] transition-colors duration-200">
                                <Share />
                            </button>
                            <AnimatePresence>
                                {exportOptions && (
                                    <motion.div
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -10 }}
                                        ref={dropdownRefExp}
                                        className="absolute -left-1 ml-10 mt-[-70px] w-48 bg-white rounded-xl shadow-lg z-50"
                                    >
                                        <button
                                            onClick={() => exportProductsToCSV([], 'all')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export All
                                        </button>
                                        <button
                                            onClick={() => exportProductsToCSV(selectedProducts.length > 0 ? selectedProducts : [], 'selected')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {selectedProducts.length > 0 && (
                            <p className='text-[#564256] font-medium text-base mt-0.5'>Selected: {selectedProducts.length}</p>
                        )}
                    </div>
                    {/* Search and Filters */}
                    <div className="flex items-end gap-4 justify-end relative">
                        <input
                            name="search"
                            type="text"
                            placeholder="Search"
                            value={searchQuery}
                            onChange={handleSearch}
                            className="text-gray-900 rounded-full px-4 py-1 shadow-sm focus:outline-none w-full"
                        />
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            ref={filterRef}
                            className="bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 items-center"
                        >
                            <Filter size={18} />
                            <span>Filter</span>
                        </button>

                        <AnimatePresence>
                            {showFilters && (

                                <motion.div
                                    initial={{ opacity: 0, x: 10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    exit={{ opacity: 0, x: 10 }}
                                    ref={dropdownRefFil}
                                    className="absolute left-0 -top-20 w-64 bg-white rounded-xl shadow-xl p-4 z-50"
                                >
                                    <CategoryFilterDropdown
                                        handleCategoryChange={handleCategoryChange}
                                        selectedCategoryName={selectedCategoryName}
                                    />

                                    <div>
                                        <label className="block text-sm font-medium mt-2">Start Date</label>
                                        <DatePicker
                                            selected={startDate}
                                            onChange={(date) => setStartDate(date)}
                                            placeholderText="Select a date"
                                            className="px-3 py-1 focus:outline-none border rounded-xl"
                                            dateFormat="dd/MM/yyyy"
                                            isClearable={!!startDate}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mt-2">End Date</label>
                                        <DatePicker
                                            selected={endDate}
                                            onChange={(date) => setEndDate(date)}
                                            placeholderText="Select a date"
                                            className="px-3 py-1 focus:outline-none border rounded-xl"
                                            dateFormat="dd/MM/yyyy"
                                            isClearable={!!endDate}
                                        />
                                    </div>

                                    {/* Apply & Reset Buttons */}
                                    <div className="flex justify-between mt-3">
                                        <button
                                            onClick={handleApplyFilters}
                                            className="bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-xl px-3 py-1 text-sm transition-colors duration-200"
                                        >
                                            Apply
                                        </button>
                                        <button
                                            onClick={resetFilters}
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-xl px-3 py-1 text-sm transition-colors duration-200"
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            className='bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 items-center'
                            onClick={handleNewClick}
                        >
                            <PlusCircle size={18} />
                            <span>New</span>
                        </button>
                    </div>
                </div>
                {newToggle && (
                    <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'>
                        <div className='bg-white rounded-xl shadow-lg p-6 relative w-auto max-h-[90vh] overflow-auto'>
                            <button
                                className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                onClick={handleNewClick}>
                                ×
                            </button>
                            <AddProduct />
                        </div>
                    </div>
                )}
            </div>
            {products.length === 0 ? (
                <p>No products found.</p>
            ) : (
                <table className="table-auto w-full bg-white rounded-xl shadow-md text-center">
                    <thead>
                        <tr className="bg-[#e8e8e8]">
                            <th className="px-4 py-2">
                                <input
                                    name='check'
                                    type="checkbox"
                                    checked={selectedProducts.length === products.length && products.length > 0}
                                    onChange={handleSelectAll}
                                />
                            </th>
                            <th className="px-4 py-2"></th>
                            <th className="px-4 py-2">Code</th>
                            <th className="px-4 py-2">Product Name</th>
                            <th className="px-4 py-2">Category</th>
                            <th className="px-4 py-2">Price</th>
                            <th className="px-4 py-2">Stock</th>
                            <th className="px-4 py-2">Added At</th>
                            <th className="px-4 py-2">Actions</th>
                            <th className="px-4 py-2">Suppliers</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product) => (
                            <tr key={product._id} className="border-b">
                                <td className="p-2">
                                    <input
                                        name='check'
                                        type="checkbox"
                                        checked={selectedProducts.includes(product._id)}
                                        onChange={() => handleProductSelection(product._id)}
                                    />
                                </td>
                                <td className="px-4 py-2">
                                    <img
                                        src={product.imageUrl || "https://via.placeholder.com/50"}
                                        alt={`${product.name} logo`}
                                        className="w-14"
                                    />
                                </td>
                                <td className="px-4 py-2">#{product.productId}</td>
                                <td className="px-4 py-2">
                                    <Link
                                        to={`/products/${product.productId}`}
                                        className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                    >
                                        {product.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-2">{product.category.name}</td>
                                <td className="px-4 py-2">{new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(product.price)}</td>
                                <td className="px-4 py-2">{product.stock}</td>
                                <td className="px-4 py-2 text-sm">
                                    <div>{new Date(product.createdAt).toLocaleDateString()}</div>
                                    <div className="text-gray-600">{new Date(product.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="px-4 py-2 space-x-2">

                                    {/* Edit Section */}
                                    <button
                                        onClick={() => handleEdit(product._id)}
                                        className="
                                         text-gray-500 hover:text-gray-800
                                         transition-colors duration-300"
                                    >
                                        <Pencil size={21} />
                                    </button>
                                    {editId === product._id && (
                                        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'>
                                            <div className='bg-white rounded-xl shadow-lg p-6 relative w-fit max-h-[90vh] overflow-auto'>
                                                <button
                                                    className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                                    onClick={() => { setEditId(null); fetchProducts(); }}>
                                                    ×
                                                </button>
                                                <EditProduct productId={product._id} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Section */}
                                    <button
                                        onClick={() => handleOpenModal(product._id)}
                                        className="text-gray-500 hover:text-red-600 transition-colors duration-300"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                </td>

                                {/* Suppliers Section */}
                                <td className='px-4 py-2 relative'>
                                    <Link
                                        to={`/admin/products/${product.productId}`}
                                        state={{ parentSearchQuery: searchQuery }}
                                        className='bg-gray-800 hover:bg-black
                                         text-white py-1.5 px-4 rounded-full 
                                         transition-colors duration-300'
                                    >
                                        Manage
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Pagination */}
            <div className="grid grid-cols-3 items-center w-full">
                <div className="flex justify-center col-span-1 col-start-2">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
                {products?.length > 0 && (
                    <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                        Showing <b>{products.length}</b> of <b>{totalProducts}</b> products
                    </p>
                )}
            </div>

            <ConfirmationModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onConfirm={() => {
                    confirmAction();
                    setIsModalOpen(false);
                }}
                title="Confirm Deletion"
                message={modalMessage}
            />
        </div>
    );
}

export default ProductsManagement;
