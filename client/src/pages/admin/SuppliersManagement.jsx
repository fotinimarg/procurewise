import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import AddSupplier from '../../components/AddSupplier';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import EditSupplier from './EditSupplier';
import { Trash2, Pencil, PlusCircle, SquarePen, Filter, Share } from 'lucide-react';
import DatePicker from 'react-datepicker';
import Pagination from '../../components/Pagination';
import ConfirmationModal from "../../components/ConfirmationModal";

const SuppliersManagement = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newToggle, setNewToggle] = useState(false);
    const [editId, setEditId] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchParams] = useSearchParams();
    const location = useLocation();
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [selectedSuppliers, setSelectedSuppliers] = useState([]);
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
    const [totalSuppliers, setTotalSuppliers] = useState(0);
    const itemsPerPage = 20;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });
    const [modalMessage, setModalMessage] = useState("");


    const supplierId = searchParams.get("supplierId");

    // Fetch suppliers from the backend
    const fetchSuppliers = async (page = 1, limit = itemsPerPage) => {
        try {
            const response = await axios.get('/suppliers',
                {
                    params: { page, limit, startDate, endDate, searchQuery: debouncedSearchQuery }
                }
            );
            setSuppliers(response.data.suppliers);
            setTotalSuppliers(response.data.totalSuppliers);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching suppliers:', error);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchSuppliers(currentPage, itemsPerPage);
    }, [currentPage]);

    useEffect(() => {
        if (location.state?.parentSearchQuery) {
            setSearchQuery(location.state.parentSearchQuery);
        }
    }, [location.state])

    useEffect(() => {
        setCurrentPage(1);
        fetchSuppliers(1, itemsPerPage);
    }, [debouncedSearchQuery, supplierId]);

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

    // Delete supplier handler
    const handleDelete = async (supplierId) => {
        setIsModalOpen(false);

        try {
            await axios.delete(`/suppliers/${supplierId}`);
            setSuppliers(suppliers.filter((supplier) => supplier._id !== supplierId));

            fetchSuppliers();
            toast.success('Supplier deleted successfully');
        } catch (error) {
            console.error('Error deleting supplier:', error);
        }
    }

    //Toggle edit form visibility
    const handleEdit = (supplierId) => {
        setEditId(supplierId);
    }

    // Toggle input visibility for new supplier form
    const handleNewClick = () => {
        setNewToggle(!newToggle);
        fetchSuppliers();
    }

    const handleApplyFilters = () => {
        setCurrentPage(1);
        fetchSuppliers(1, itemsPerPage);
        setShowFilters(false);
    }

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setCurrentPage(1);
    }

    // Toggle product selection
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
            setSelectedSuppliers(suppliers.map((supplier) => supplier._id));
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

    // Bulk Delete Action
    const handleOpenBulkModal = () => {
        if (selectedSuppliers.length === 0) {
            toast.error("No suppliers selected for deletion.");
            return;
        }
        setConfirmAction(() => handleBulkDelete);
        setModalMessage(`Are you sure you want to delete ${selectedSuppliers.length} suppliers? This action cannot be undone.`);
        setIsModalOpen(true);
    };

    // Single Delete Action
    const handleOpenModal = (id) => {
        setConfirmAction(() => () => handleDelete(id));
        setModalMessage("Are you sure you want to delete this supplier?");
        setIsModalOpen(true);
    };

    // Bulk delete selected suppliers
    const handleBulkDelete = async () => {
        setIsModalOpen(false);

        try {
            const response = await axios.delete('/suppliers/admin/bulk-delete', { data: { supplierIds: selectedSuppliers } });

            setSuppliers(suppliers.filter((supplier) => !selectedSuppliers.includes(supplier._id)));

            setSelectedSuppliers([]);
            deletedCount = response.deletedCount
            toast.success(`${deletedCount} suppliers deleted successfully!`);
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

            const response = await axios.post('/suppliers/admin/export-suppliers',
                {
                    supplierIds: selectedSupplierIds,
                    exportType,
                    searchQuery,
                    startDate,
                    endDate,
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

    if (loading) return <p className='text-center'>Loading suppliers...</p>;

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <div className='flex flex-col justify-between relative mb-3'>
                <h2 className="text-2xl font-semibold mb-4 ">Suppliers Management</h2>
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

                                    <div>
                                        <label className="block text-sm font-medium">Start Date</label>
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

                        <button className='bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 items-center'
                            onClick={handleNewClick}>
                            <PlusCircle size={18} />
                            <span>New</span>
                        </button>
                    </div>
                </div>
                {newToggle && (
                    <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'>
                        <div className='bg-white rounded-xl shadow-lg p-6 relative w-fit max-h-[90vh] overflow-auto'>
                            <button
                                className='absolute top-2 right-2 text-gray-500 hover:text-gray-800'
                                onClick={handleNewClick}>
                                ×
                            </button>
                            <AddSupplier />
                        </div>
                    </div>
                )}
            </div>
            {suppliers.length === 0 ? (
                <p className='mt-5'>No suppliers found.</p>
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
                            <th className="px-4 py-2">Supplier Name</th>
                            <th className="px-4 py-2">VAT</th>
                            <th className="px-4 py-2">Link</th>
                            <th className="px-4 py-2">Added At</th>
                            <th className="px-4 py-2">Actions</th>
                            <th className="px-4 py-2">Products</th>
                        </tr>
                    </thead>
                    <tbody>
                        {suppliers.map((supplier) => (
                            <tr key={supplier._id} className="border-b">
                                <td className="p-2">
                                    <input
                                        name='check'
                                        type="checkbox"
                                        checked={selectedSuppliers.includes(supplier._id)}
                                        onChange={() => handleSupplierSelection(supplier._id)}
                                    />
                                </td>
                                <td className="px-4 py-2">#{supplier.supplierId}</td>
                                <td className="px-4 py-2">
                                    <Link
                                        to={`/suppliers/${supplier.supplierId}`}
                                        className="hover:text-[#fc814a] hover:underline transition-colors duration-100"
                                    >
                                        {supplier.name}
                                    </Link>
                                </td>
                                <td className="px-4 py-2 text-wrap">{supplier.vatNumber}</td>
                                <td className="px-4 py-2 text-wrap">{supplier.link}</td>
                                <td className="px-4 py-2 text-sm">
                                    <div>{new Date(supplier.createdAt).toLocaleDateString()}</div>
                                    <div className="text-gray-600">{new Date(supplier.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                </td>
                                <td className="px-4 py-2 space-x-2">

                                    {/* Edit Section */}
                                    <button
                                        onClick={() => handleEdit(supplier._id)}
                                        className="text-gray-500 hover:text-gray-800
                                         transition-colors duration-300"
                                    >
                                        <Pencil size={21} />
                                    </button>
                                    {editId === supplier._id && (
                                        <div className='fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50'>
                                            <div className='bg-white rounded-xl shadow-lg p-6 relative w-fit max-h-[90vh] overflow-auto'>
                                                <button
                                                    className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                                                    onClick={() => setEditId(false)}>
                                                    ×
                                                </button>
                                                <EditSupplier supplierId={supplier._id} />
                                            </div>
                                        </div>
                                    )}

                                    {/* Delete Section */}
                                    <button
                                        onClick={() => handleOpenModal(supplier._id)}
                                        className="text-gray-500 hover:text-red-600 transition-colors duration-300"
                                    >
                                        <Trash2 size={22} />
                                    </button>
                                </td>
                                {/* Products Section */}
                                <td className='px-4 py-2 relative'>
                                    <Link
                                        to={`/admin/suppliers/${supplier.supplierId}`}
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
                {suppliers?.length > 0 && (
                    <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                        Showing <b>{suppliers.length}</b> of <b>{totalSuppliers}</b> suppliers
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
};

export default SuppliersManagement;
