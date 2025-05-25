import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Trash2, Pencil, ChevronLeft, PlusCircle, SquarePen, Share } from 'lucide-react';
import Pagination from '../../components/Pagination';
import { AnimatePresence, motion } from 'framer-motion';
import ConfirmationModal from '../../components/ConfirmationModal';

const AdminProduct = () => {
    const { productId } = useParams();
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [quantity, setQuantity] = useState('');
    const [price, setPrice] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [newToggle, setNewToggle] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [parentSearchQuery, setParentSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
    const [exportOptions, setExportOptions] = useState(false);
    const [showBulkActions, setShowBulkActions] = useState(false);

    const dropdownRef = useRef(null);
    const dropdownRefExp = useRef(null);
    const buttonRef = useRef(null);
    const exportRef = useRef(null);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });
    const [modalMessage, setModalMessage] = useState("");

    const navigate = useNavigate();
    const location = useLocation();

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const itemsPerPage = 20;

    // Fetch suppliers for the product
    const fetchSuppliers = async (page = 1, limit = itemsPerPage) => {
        try {
            const response = await axios.get(`/products/${productId}/suppliers/admin`,
                {
                    params: { page, limit, searchQuery: debouncedSearchQuery }
                }
            );
            if (response.status === 204) {
                setSuppliers([]);
            } else {
                setSuppliers(response.data.suppliers);
                setTotalSuppliers(response.data.totalSuppliers);
                setTotalPages(response.data.totalPages);
            }
        } catch (error) {
            console.error('Error fetching suppliers:', error);
            toast.error('Failed to load suppliers.');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSuppliers(currentPage, itemsPerPage);
    }, [productId, currentPage]);

    useEffect(() => {
        if (location.state?.parentSearchQuery) {
            setParentSearchQuery(location.state.parentSearchQuery);
        }
    }, [location.state]);

    // Filter suppliers based on search query
    useEffect(() => {
        setCurrentPage(1);
        fetchSuppliers(1, itemsPerPage);
    }, [debouncedSearchQuery, supplierId])

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

    // Go back to products management keeping the search query that existed
    const handleGoBack = () => {
        navigate('/admin/products', { state: { parentSearchQuery } });
    }

    const handleNewClick = () => {
        setNewToggle(!newToggle);
    }

    const handleEditClick = (supplier) => {
        setEditingSupplier(supplier);
        setPrice(supplier.price);
        setQuantity(supplier.quantity);
    }

    const handleSave = async () => {
        const supplierId = editingSupplier.supplierDetails.supplierId;

        try {
            const response = await axios.put(`/products/${productId}/suppliers`, { supplierId, quantity, price });

            toast.success('Supplier updated successfully!');
            setEditingSupplier(null);
            setPrice('');
            setQuantity('');

            fetchSuppliers();
        } catch (error) {
            console.error('Error updating supplier:', error);
            toast.error('Failed to update supplier.');
        }
    }

    const handleRemove = async (supplierId) => {
        try {
            const response = await axios.delete(`/products/${productId}/suppliers/${supplierId}`);

            toast.success('Supplier removed successfully!');

            fetchSuppliers();
        } catch (error) {
            console.error('Error removing supplier:', error);
            toast.error('Failed to remove supplier.');
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            const response = await axios.post(`/products/${productId}/suppliers`, { supplierId, quantity, price });

            toast.success('Supplier added successfully!');
            setNewToggle(false);
            setSupplierId('');
            setPrice('');
            setQuantity('');
            fetchSuppliers();
        } catch (error) {
            console.error('Error managing supplier:', error);
        }
    }

    // Bulk Remove Action
    const handleOpenBulkModal = () => {
        if (selectedSuppliers.length === 0) {
            toast.error("No suppliers selected for removal.");
            return;
        }
        setConfirmAction(() => handleBulkDelete);
        setModalMessage(`Are you sure you want to remove ${selectedSuppliers.length} suppliers? This action cannot be undone.`);
        setIsModalOpen(true);
    }

    // Single Remove Action
    const handleOpenModal = (id) => {
        setConfirmAction(() => () => handleRemove(id));
        setModalMessage("Are you sure you want to remove this supplier?");
        setIsModalOpen(true);
    }

    // Toggle supplier selection
    const handleSupplierSelection = (supplierId) => {
        setSelectedSuppliers((prev) =>
            prev.includes(supplierId)
                ? prev.filter((id) => id !== supplierId)
                : [...prev, supplierId]
        );
    }

    // Select/Deselect all suppliers
    const handleSelectAll = () => {
        if (selectedSuppliers.length === suppliers.length) {
            setSelectedSuppliers([]);
        } else {
            setSelectedSuppliers(suppliers.map((supplier) => supplier.supplierDetails._id));
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
        };

        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    // Bulk remove selected suppliers
    const handleBulkDelete = async () => {
        if (selectedSuppliers.length === 0) {
            toast.error("No suppliers selected for removal.");
            return;
        }

        setIsModalOpen(false);

        try {
            const { data } = await axios.delete(`/products/${productId}/suppliers/bulk/remove`, {
                data: { supplierIds: selectedSuppliers }
            });

            fetchSuppliers();
            setSelectedSuppliers([]);
            toast.success(`${data.removedConnections.length} suppliers deleted successfully!`);
        } catch (error) {
            console.error("Error deleting suppliers:", error);
            toast.error("Failed to delete suppliers.");
        }
    }

    const exportSuppliersToCSV = async (selectedSupplierIds, exportType) => {
        try {
            if (exportType === 'selected' && selectedSupplierIds.length === 0) {
                toast.error('No selected suppliers.');
                return;
            }

            const response = await axios.post(`/products/${productId}/suppliers/export-suppliers`,
                {
                    supplierIds: selectedSupplierIds,
                    exportType,
                    searchQuery,
                    currentPage,
                    itemsPerPage
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'suppliers.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting suppliers:', error);
            toast.error('Failed to export suppliers.');
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
            <h2 className="text-2xl font-semibold mb-4">{productId}: Manage Suppliers</h2>
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
                                        onClick={() => exportSuppliersToCSV([], 'all')}
                                        className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                    >
                                        Export All
                                    </button>
                                    <button
                                        onClick={() => exportSuppliersToCSV(selectedSuppliers.length > 0 ? selectedSuppliers : [], 'selected')}
                                        className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                    >
                                        Export Selected
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    {selectedSuppliers.length > 0 && (
                        <p className='text-[#564256] font-medium text-base mt-0.5'>Selected: {selectedSuppliers.length}</p>
                    )}
                </div>
                <div className='flex justify-end gap-4'>
                    <input
                        name='search'
                        type="text"
                        placeholder="Search"
                        value={searchQuery}
                        onChange={handleSearch}
                        className="text-gray-900 rounded-full px-4 py-1 shadow-sm focus:outline-none"
                    />
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
                                    setSupplierId('');
                                    setPrice('');
                                    setQuantity('');
                                }}>
                                ×
                            </button>

                            <div>
                                <h3 className="text-base font-semibold mb-2">Add Supplier</h3>
                                <input
                                    type="text"
                                    placeholder="Supplier ID"
                                    value={supplierId}
                                    onChange={(e) => setSupplierId(e.target.value)}
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
                suppliers.length === 0 ? (
                    <p>No suppliers found.</p>
                ) : (
                    <table className="table-auto w-full bg-white rounded-xl shadow-md text-center">
                        <thead>
                            <tr className="bg-[#e8e8e8]">
                                <th className="px-4 py-2">
                                    <input
                                        name='check'
                                        type="checkbox"
                                        checked={selectedSuppliers.length === suppliers.length && suppliers.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-4 py-2">Code</th>
                                <th className="px-4 py-2">Supplier</th>
                                <th className="px-4 py-2">Price</th>
                                <th className="px-4 py-2">Quantity</th>
                                <th className="px-4 py-2">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {suppliers.map((supplier) => (
                                <tr key={supplier.supplierDetails._id} className="border-b">
                                    <td className="p-2">
                                        <input
                                            name='check'
                                            type="checkbox"
                                            checked={selectedSuppliers.includes(supplier.supplierDetails._id)}
                                            onChange={() => handleSupplierSelection(supplier.supplierDetails._id)}
                                        />
                                    </td>
                                    <td className="px-4 py-2">#{supplier.supplierDetails.supplierId}</td>
                                    <td className="px-4 py-2">
                                        <Link
                                            to={`/suppliers/${supplier.supplierDetails.supplierId}`}
                                            className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                        >
                                            {supplier.supplierDetails.name}
                                        </Link>
                                    </td>
                                    <td className="px-4 py-2">{new Intl.NumberFormat('el', { style: 'currency', currency: 'EUR' }).format(supplier.price)}</td>
                                    <td className="px-4 py-2">{supplier.quantity}</td>
                                    <td className='px-4 py-2 relative space-x-4'>
                                        <button
                                            onClick={() => handleEditClick(supplier)}
                                            className="
                                         text-gray-500 hover:text-gray-800
                                         transition-colors duration-300"
                                        >
                                            <Pencil size={21} />
                                        </button>
                                        <button
                                            onClick={() => handleOpenModal(supplier.supplierDetails.supplierId)}
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
                {suppliers?.length > 0 && (
                    <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                        Showing <b>{suppliers.length}</b> of <b>{totalSuppliers}</b> suppliers
                    </p>
                )}
            </div>

            {editingSupplier && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
                    <div className="relative bg-white p-6 rounded-xl shadow-lg w-96">
                        <h3 className="text-lg font-semibold mb-4">Edit Supplier</h3>
                        <form onSubmit={(e) => e.preventDefault()}>
                            {/* Close Button */}
                            <button
                                className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                onClick={() => {
                                    setEditingSupplier(null);
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
            )}

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

export default AdminProduct;