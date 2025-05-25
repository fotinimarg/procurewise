import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, Pencil, ChevronLeft, PlusCircle, SquarePen, Share, Filter } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/ConfirmationModal';
import CategoryFilterDropdown from '../../components/CategoryFilterDropdown';

const AdminSupplier = () => {
    const { supplierId } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingProduct, setEditingProduct] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [productId, setProductId] = useState('');
    const [newToggle, setNewToggle] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [selectedCategoryName, setSelectedCategoryName] = useState(null);

    const [selectedProducts, setSelectedProducts] = useState([]);
    const [exportOptions, setExportOptions] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    const dropdownRef = useRef(null);
    const dropdownRefExp = useRef(null);
    const dropdownRefFil = useRef(null);
    const buttonRef = useRef(null);
    const exportRef = useRef(null);
    const filterRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });
    const [modalMessage, setModalMessage] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProducts, setTotalProducts] = useState(0);
    const itemsPerPage = 20;

    // Fetch suppliers for the product
    const fetchProducts = async (categoryName = null, page = 1, limit = itemsPerPage) => {
        try {
            const response = await axios.get(`/suppliers/${supplierId}/products/admin`,
                {
                    params: { page, limit, searchQuery: debouncedSearchQuery, categoryName }
                }
            );
            if (response.status === 204) {
                setProducts([]);
            } else {
                setProducts(response.data.products);
                setTotalProducts(response.data.totalProducts);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
            toast.error('Failed to load products.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchProducts(null, currentPage, itemsPerPage);
    }, [supplierId, currentPage]);

    useEffect(() => {
        if (location.state?.parentSearchQuery) {
            setParentSearchQuery(location.state.parentSearchQuery);
        }
    }, [location.state]);

    // Filter products based on search query
    useEffect(() => {
        setCurrentPage(1);
        fetchProducts(null, 1, itemsPerPage);
    }, [debouncedSearchQuery, productId])

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchProducts(selectedCategoryName, 1, itemsPerPage);
        setShowFilters(false);
    }

    const resetFilters = () => {
        setSelectedCategoryName("");
        setCurrentPage(1);
    }

    const handleCategoryChange = (categoryId, categoryName) => {
        setSelectedCategoryName(categoryName);
    }

    // Update search query after user stops typing
    useEffect(() => {
        const timeout = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery);
        }, 800);

        return () => clearTimeout(timeout);
    }, [searchQuery]);

    // Handle search input change
    const handleSearch = (event) => {
        setSearchQuery(event.target.value);
    }

    // Go back to suppliers management keeping the search query that existed
    const handleGoBack = () => {
        navigate('/admin/suppliers', { state: { parentSearchQuery } });
    }

    const handleNewClick = () => {
        setNewToggle(!newToggle);
    }

    const handleEditClick = (product) => {
        setEditingProduct(product);
        setPrice(product.price);
        setQuantity(product.quantity);
    };

    const handleSave = async () => {
        const productId = editingProduct.productDetails.productId;

        try {
            const response = await axios.put(`/suppliers/${supplierId}/products`, { productId, quantity, price });

            toast.success('Product updated successfully!');
            setEditingProduct(null);
            setPrice('');
            setQuantity('');

            fetchProducts();
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Failed to update product.');
        }
    }

    const handleRemove = async (productId) => {
        try {
            const response = await axios.delete(`/suppliers/${supplierId}/products/${productId}`);

            toast.success('Product removed successfully!');

            fetchProducts();
        } catch (error) {
            console.error('Error removing product:', error);
            toast.error('Failed to remove product.');
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`/suppliers/${supplierId}/products`, { productId, quantity, price });

            toast.success('Product added successfully!');
            setNewToggle(false);
            setPrice('');
            setQuantity('');

            fetchProducts();
        } catch (error) {
            console.error('Error managing product:', error);
        }
    }

    // Bulk Remove Action
    const handleOpenBulkModal = () => {
        if (selectedProducts.length === 0) {
            toast.error("No products selected for removal.");
            return;
        }
        setConfirmAction(() => handleBulkDelete);
        setModalMessage(`Are you sure you want to remove ${selectedProducts.length} products? This action cannot be undone.`);
        setIsModalOpen(true);
    }

    // Single Remove Action
    const handleOpenModal = (id) => {
        setConfirmAction(() => () => handleRemove(id));
        setModalMessage("Are you sure you want to remove this product?");
        setIsModalOpen(true);
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
            setSelectedProducts(products.map((product) => product.productDetails._id));
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
            const { data } = await axios.delete(`/suppliers/${supplierId}/products/bulk/remove`, { data: { productIds: selectedProducts } });

            fetchProducts();
            setSelectedProducts([]);
            toast.success(`${data.removedConnections.length} products deleted successfully!`);
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

            const response = await axios.post(`/suppliers/${supplierId}/products/export`,
                {
                    productIds: selectedProductIds,
                    exportType,
                    searchQuery,
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

    if (loading) return <p className='text-center'>Loading...</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <button
                onClick={handleGoBack}
                className='hover:text-[#fc814a] transition-colors duration-200 flex items-center justify-start w-16'
            >
                <ChevronLeft size={18} />
                Back
            </button>
            <h2 className="text-2xl font-semibold mb-4 ">{supplierId}: Manage Products</h2>
            <div className='flex justify-between mb-3 items-center relative'>
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
                <div className='flex justify-end gap-4 relative'>
                    <input
                        name='search'
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="text-gray-900 rounded-full px-4 py-1 shadow-sm focus:outline-none"
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
                    <button className='bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1 transition-colors duration-300 flex gap-2 items-center'
                        onClick={handleNewClick}>
                        <PlusCircle size={18} />
                        <span>New Link</span>
                    </button>
                </div>
                {newToggle && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center">
                        <div className="relative bg-white rounded-xl p-6 shadow-xl w-96">

                            {/* Close Button */}
                            <button
                                className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                onClick={() => {
                                    setNewToggle(false);
                                    setPrice('');
                                    setQuantity('');
                                }}>
                                ×
                            </button>

                            <div>
                                <h3 className="text-base font-semibold mb-2">Add Product</h3>
                                <input
                                    type="text"
                                    placeholder="Product ID"
                                    value={productId}
                                    onChange={(e) => setProductId(e.target.value)}
                                    className="w-full border p-2 rounded-xl mb-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Quantity"
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full border p-2 rounded-xl mb-2"
                                />
                                <input
                                    type="number"
                                    placeholder="Price"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className="w-full border p-2 rounded-xl"
                                />
                            </div>

                            <div className="mt-6 text-end">
                                <button
                                    onClick={(e) => handleSubmit(e)}
                                    className="bg-gray-800 text-white px-4 py-2 rounded-xl hover:bg-black transition-colors duration-300"
                                >
                                    Submit
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div >
            {
                products.length === 0 ? (
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
                                <th className="px-4 py-2">Product</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Quantity</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product) => (
                                <tr key={product.productDetails._id} className="border-b">
                                    <td className="p-2">
                                        <input
                                            name='check'
                                            type="checkbox"
                                            checked={selectedProducts.includes(product.productDetails._id)}
                                            onChange={() => handleProductSelection(product.productDetails._id)}
                                        />
                                    </td>
                                    <td className="px-4 py-2">
                                        <img
                                            src={product.productDetails.imageUrl || "https://via.placeholder.com/50"}
                                            alt={`${product.productDetails.name} logo`}
                                            className="w-14"
                                        />
                                    </td>
                                    <td className="px-4 py-2">#{product.productDetails.productId}</td>
                                    <td className="px-4 py-2">
                                        <Link
                                            to={`/products/${product.productDetails.productId}`}
                                            className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                        >
                                            {product.productDetails.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(product.price)}</td>
                                    <td className="px-4 py-2">{product.quantity}</td>
                                    <td className='px-4 py-2 relative space-x-3'>
                                        <button
                                            onClick={() => handleEditClick(product)}
                                            className="
                                         text-gray-500 hover:text-gray-800
                                         transition-colors duration-300"
                                        >
                                            <Pencil size={21} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(product.productDetails.productId)}
                                            className="text-gray-500 hover:text-red-600 transition-colors duration-300"
                                        >
                                            <Trash2 size={22} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )
            }

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

            {
                editingProduct && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                        <div className="relative bg-white p-6 rounded-xl shadow-lg w-96">
                            <h3 className="text-lg font-semibold mb-4">Edit Product</h3>
                            <form onSubmit={(e) => e.preventDefault()}>
                                {/* Close Button */}
                                <button
                                    className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                    onClick={() => {
                                        setEditingProduct(null);
                                        setPrice('');
                                        setQuantity('');
                                    }}>
                                    ×
                                </button>
                                <div className="mb-4">
                                    <label className="block text-gray-700">Price</label>
                                    <input
                                        type="number"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full border p-2 rounded-xl"
                                    />
                                </div>
                                <div className="mb-4">
                                    <label className="block text-gray-700">Quantity</label>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        className="w-full border p-2 rounded-xl"
                                    />
                                </div>
                                <div className="text-end">
                                    <button
                                        className="bg-[#fc814a] text-white px-4 py-2 rounded-xl hover:bg-[#fc5f18] transition-colors duration-300"
                                        onClick={handleSave}
                                    >
                                        Save
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

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
        </div >
    );
}

export default AdminSupplier;
