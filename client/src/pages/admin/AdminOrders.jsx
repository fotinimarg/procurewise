import axios from 'axios';
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';
import CustomStatusDropdown from '../../components/CustomStatusDropdown';
import OrderPopup from '../../components/OrderPopup';
import Pagination from '../../components/Pagination';
import DatePicker from 'react-datepicker';
import { motion, AnimatePresence } from 'framer-motion';
import { Share, SquarePen, Filter } from 'lucide-react';
import { useSearchParams } from "react-router-dom";

const AdminOrders = () => {
    const [orders, setOrders] = useState([]);
    const [completedOrders, setCompletedOrders] = useState([]);
    const [activeTab, setActiveTab] = useState('inProgress');
    const [sortOrder, setSortOrder] = useState("asc");
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [isPopupOpen, setIsPopupOpen] = useState(false);

    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

    const [showFilters, setShowFilters] = useState(false);

    const [selectedOrders, setSelectedOrders] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [selectedStatus, setSelectedStatus] = useState('');
    const [exportOptions, setExportOptions] = useState(false);

    const dropdownRef = useRef(null);
    const dropdownRefExp = useRef(null);
    const dropdownRefFil = useRef(null);
    const buttonRef = useRef(null);
    const exportRef = useRef(null);
    const filterRef = useRef(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [currentPageN, setCurrentPageN] = useState(1);
    const [totalPages, setTotalPages] = useState('');
    const [totalPagesN, setTotalPagesN] = useState('');
    const [totalComOrders, setTotalComOrders] = useState('');
    const [totalOrders, setTotalOrders] = useState('');
    const itemsPerPage = 20;

    const [searchParams] = useSearchParams();

    // Fetch completed orders
    const fetchOrders = async (page = 1, limit = itemsPerPage) => {
        try {
            const startDateObj = startDate ? new Date(startDate) : null;
            const endDateObj = endDate ? new Date(endDate) : null;

            const userFilter = searchParams.get("user") || '';
            const searchQueryFinal = searchQuery || userFilter;

            const response = await axios.get('/order/admin/completed', {
                params: {
                    page,
                    limit,
                    searchQuery: searchQueryFinal,
                    startDate: startDateObj ? startDateObj.toISOString() : undefined,
                    endDate: endDateObj ? endDateObj.toISOString() : undefined
                }
            });
            setCompletedOrders(response.data.orders);
            setTotalPages(response.data.totalPages);
            setTotalComOrders(response.data.totalOrders);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    // Fetch non-completed orders
    const fetchNonCompletedOrders = async (page = 1, limit = itemsPerPage) => {
        try {
            const startDateObj = startDate ? new Date(startDate) : null;
            const endDateObj = endDate ? new Date(endDate) : null;

            const userFilter = searchParams.get("user") || '';
            const searchQueryFinal = searchQuery || userFilter;

            const response = await axios.get('/order/admin/non-completed', {
                params: {
                    page,
                    limit,
                    searchQuery: searchQueryFinal,
                    statusFilter,
                    startDate: startDateObj ? startDateObj.toISOString() : undefined,
                    endDate: endDateObj ? endDateObj.toISOString() : undefined
                }
            });
            setOrders(response.data.orders);
            setTotalOrders(response.data.totalOrders);
            setTotalPagesN(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    }

    useEffect(() => {
        fetchOrders(currentPage, itemsPerPage);
    }, [currentPage, debouncedSearchQuery]);

    useEffect(() => {
        fetchNonCompletedOrders(currentPageN, itemsPerPage);
    }, [currentPageN, debouncedSearchQuery]);

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

    const handleTabClick = (tab) => {
        setActiveTab(tab);
        setSelectedOrders([]);
    }

    const handleApplyFilters = () => {
        setCurrentPage(1);
        setCurrentPageN(1);
        fetchOrders(1, itemsPerPage);
        fetchNonCompletedOrders(1, itemsPerPage);
        setShowFilters(false);
    }

    const resetFilters = () => {
        setStartDate("");
        setEndDate("");
        setStatusFilter("All");
        setCurrentPage(1);
        setCurrentPageN(1);
    }

    const handleOrderSelection = (orderId) => {
        setSelectedOrders((prev) =>
            prev.includes(orderId)
                ? prev.filter((id) => id !== orderId)
                : [...prev, orderId]
        );
    }

    // Select/Deselect all orders
    const handleSelectAll = () => {
        if (activeTab === 'inProgress') {
            if (selectedOrders.length === orders.length) {
                setSelectedOrders([]);
            } else {
                setSelectedOrders(orders.map((order) => order._id));
            }
        } else {
            if (selectedOrders.length === completedOrders.length) {
                setSelectedOrders([]);
            } else {
                setSelectedOrders(completedOrders.map((order) => order._id));
            }
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

    const toggleSortOrder = () => {
        setSortOrder((prevOrder) => (prevOrder === "asc" ? "desc" : "asc"));
    }

    const sortOrders = (orders) => {
        return [...orders].sort((a, b) => {
            if (sortOrder === "asc") {
                return new Date(a.orderDate) - new Date(b.orderDate);
            }
            return new Date(b.orderDate) - new Date(a.orderDate);
        })
    }

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

    const handleStatusChange = async (orderId, newStatus) => {
        try {
            await axios.put(`/order/admin/status/${orderId}`, { status: newStatus });
            toast.success('Order status updated successfully!');
            fetchNonCompletedOrders(currentPageN, itemsPerPage);
            fetchOrders(currentPage, itemsPerPage);
        } catch (error) {
            console.error('Error changing order status:', error);
            toast.error('Failed to change status.');
        }
    }

    const handleBulkUpdateStatus = async () => {
        if (selectedOrders.length === 0) {
            toast.error("No orders selected for status update.");
            return;
        }

        if (!selectedStatus) {
            toast.error("Please select a status.");
            return;
        }

        try {
            await axios.put('/order/admin/bulk-update', {
                orderIds: selectedOrders,
                newStatus: selectedStatus,
            });

            fetchNonCompletedOrders(currentPageN, itemsPerPage);
            fetchOrders(currentPage, itemsPerPage);
            setSelectedOrders([]);
            setSelectedStatus('');
            toast.success("Order status updated successfully!");
        } catch (error) {
            console.error("Error updating status:", error);
            toast.error("Failed to update order status.");
        }
    }

    const exportOrdersToCSV = async (selectedOrders, exportType) => {
        try {
            if (exportType === 'selected' && selectedOrders.length === 0) {
                toast.error('No selected orders.');
                return;
            }

            const response = await axios.post('/order/admin/export',
                {
                    orderIds: selectedOrders,
                    exportType,
                    searchQuery,
                    statusFilter,
                    dateFrom: startDate,
                    dateTo: endDate,
                    currentPage,
                    itemsPerPage
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'orders.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting orders:', error);
            toast.error('Failed to export orders.');
        }
    }

    const statusStyles = {
        ordered: { backgroundColor: '#3DBADA', color: 'white', margin: '0 auto' },
        reviewed: { backgroundColor: '#f6c16b', color: 'white', margin: '0 auto' },
        shipped: { backgroundColor: '#F18D9E', color: 'white', margin: '0 auto' },
        completed: { backgroundColor: '#47C978', color: 'white', margin: '0 auto' },
        canceled: { backgroundColor: '#D22B2B', color: 'white', margin: '0 auto' }
    }

    const statusOptions = ['ordered', 'reviewed', 'shipped', 'completed', 'canceled'];
    const statusChoose = ['All', 'ordered', 'reviewed', 'shipped', 'canceled'];

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <div className='flex flex-col justify-between relative mb-3'>
                <h2 className="text-2xl font-semibold mb-4">Manage Orders</h2>
                <div className='flex justify-between items-end relative'>
                    <div className='flex gap-4 -mb-2 ml-1'>
                        {activeTab === 'inProgress' && (
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
                                            className="absolute left-0 ml-10 mt-[-70px] w-48 bg-white rounded-xl shadow-lg z-50 py-1"
                                        >

                                            {/* Bulk Update Status */}
                                            <div className="px-4 py-2">
                                                <select
                                                    className="w-full mt-1 border rounded-lg px-2 py-1 text-sm"
                                                    value={selectedStatus}
                                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                                >
                                                    <option value="">Select Status</option>
                                                    <option value="reviewed">Reviewed</option>
                                                    <option value="shipped">Shipped</option>
                                                    <option value="completed">Completed</option>
                                                    <option value="canceled">Canceled</option>
                                                </select>
                                                <button
                                                    onClick={handleBulkUpdateStatus}
                                                    className="w-full mt-2 text-sm bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-lg px-3 py-1 transition-colors duration-200"
                                                >
                                                    Apply Status
                                                </button>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}

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
                                            onClick={() => exportOrdersToCSV([], 'all')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export All
                                        </button>
                                        <button
                                            onClick={() => exportOrdersToCSV([], activeTab === 'inProgress' ? 'non-completed' : 'completed')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export {activeTab === 'inProgress' ? 'In-Progress' : 'Completed'}
                                        </button>
                                        <button
                                            onClick={() => exportOrdersToCSV(selectedOrders.length > 0 ? selectedOrders : [], 'selected')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {selectedOrders.length > 0 && (
                            <p className='text-[#564256] font-medium text-base mt-0.5'>Selected: {selectedOrders.length}</p>
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

                                    {/* Status Filter */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full mt-1 border rounded-xl px-2 py-1 text-sm"
                                        >
                                            {statusChoose.map((status) => (
                                                <option key={status} value={status}>
                                                    {status === 'All' ? 'All' : status.charAt(0).toUpperCase() + status.slice(1)}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

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
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex mb-4 border-b">
                <button
                    className={`px-4 py-2 cursor-pointer ${activeTab === 'inProgress' ? 'border-b-2 border-[#fc814a] text-[#fc814a]' : ''}`}
                    onClick={() => handleTabClick('inProgress')}
                >
                    In-Progress Orders
                </button>
                <button
                    className={`px-4 py-2 cursor-pointer ${activeTab === 'completed' ? 'border-b-2 border-[#fc814a] text-[#fc814a]' : ''}`}
                    onClick={() => handleTabClick('completed')}
                >
                    Completed Orders
                </button>
            </div>

            {/* Render In-progress Orders */}
            {activeTab === 'inProgress' && (orders.length > 0 ? (
                <section>
                    <div className="bg-white shadow-md rounded-xl">
                        <table className="table-auto w-full text-center border-collapse">
                            <thead className="bg-[#e8e8e8]">
                                <tr>
                                    <th className="px-4 py-2">
                                        <input
                                            name='check'
                                            type="checkbox"
                                            checked={selectedOrders.length === orders.length && orders.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-2">Order ID</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th
                                        className="px-4 py-2 cursor-pointer"
                                        onClick={toggleSortOrder}
                                    >
                                        Date {sortOrder === "asc" ? "↑" : "↓"}
                                    </th>
                                    <th className="px-4 py-2">Total Amount</th>
                                    <th className="py-2">Status</th>
                                    <th className='px-4 py-2'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortOrders(orders).map(order => (
                                    <tr key={order._id} className="border-t">
                                        <td className="p-2">
                                            <input
                                                name='check'
                                                type="checkbox"
                                                checked={selectedOrders.includes(order._id)}
                                                onChange={() => handleOrderSelection(order._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">#{order.orderId}</td>
                                        <td className="px-4 py-2">{order.user?.username || "Deleted User"}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <div>{new Date(order.orderDate).toLocaleDateString()}</div>
                                            <div className="text-gray-600">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            {new Intl.NumberFormat('el', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(order.totalAmount)}
                                        </td>
                                        <td className="py-2">
                                            <CustomStatusDropdown
                                                currentStatus={order.status}
                                                onStatusChange={(newStatus) => handleStatusChange(order._id, newStatus)}
                                                statusOptions={statusOptions}
                                                statusStyles={statusStyles}
                                            />
                                        </td>
                                        <td className="px-4 py-2">
                                            <button
                                                onClick={() => handleViewOrder(order.orderId)}
                                                className="px-4 py-1 rounded-xl border border-gray-300 text-[#fc814a] hover:bg-[#e8e8e8] hover:text-[#564256] transition-colors duration-300"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Order Popup */}
                    {isPopupOpen && (
                        <OrderPopup
                            order={selectedOrder}
                            onClose={() => setIsPopupOpen(false)}
                        />
                    )}
                    {/* Pagination Controls */}
                    <div className="grid grid-cols-3 items-center w-full">
                        <div className="flex justify-center col-span-1 col-start-2">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPagesN}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                        <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                            Showing <b>{orders.length}</b> of <b>{totalOrders}</b> orders
                        </p>
                    </div>
                </section>
            ) : (
                <div className="p-4">
                    <p>No orders found matching your search or filter criteria.</p>
                </div>
            ))}

            {/* Render Completed Orders */}
            {activeTab === 'completed' && (completedOrders.length > 0 ? (
                <section>
                    <div className="bg-white shadow-md rounded-xl">
                        <table className="table-auto w-full text-center border-collapse">
                            <thead className="bg-[#e8e8e8]">
                                <tr>
                                    <th className="px-4 py-2">
                                        <input
                                            name='check'
                                            type="checkbox"
                                            checked={selectedOrders.length === completedOrders.length && completedOrders.length > 0}
                                            onChange={handleSelectAll}
                                        />
                                    </th>
                                    <th className="px-4 py-2">Order ID</th>
                                    <th className="px-4 py-2">Customer</th>
                                    <th
                                        className="px-4 py-2 cursor-pointer"
                                        onClick={toggleSortOrder}
                                    >
                                        Date {sortOrder === "asc" ? "↑" : "↓"}
                                    </th>
                                    <th className="px-4 py-2">Total Amount</th>
                                    <th className="px-4 py-2">Status</th>
                                    <th className='px-4 py-2'>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortOrders(completedOrders).map(order => (
                                    <tr key={order._id} className="border-t">
                                        <td className="p-2">
                                            <input
                                                name='check'
                                                type="checkbox"
                                                checked={selectedOrders.includes(order._id)}
                                                onChange={() => handleOrderSelection(order._id)}
                                            />
                                        </td>
                                        <td className="px-4 py-2">#{order.orderId}</td>
                                        <td className="px-4 py-2">{order.user?.username || "Deleted User"}</td>
                                        <td className="px-4 py-2 text-sm">
                                            <div>{new Date(order.orderDate).toLocaleDateString()}</div>
                                            <div className="text-gray-600">{new Date(order.orderDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-4 py-2">
                                            {new Intl.NumberFormat('el', {
                                                style: 'currency',
                                                currency: 'EUR',
                                            }).format(order.totalAmount)}
                                        </td>
                                        <td className="py-2 relative">
                                            <p className='py-1 rounded-xl px-4 flex justify-center items-center w-fit'
                                                style={statusStyles[order.status]}>
                                                {order.status}
                                            </p>
                                        </td>
                                        <td className="py-2">
                                            <button
                                                onClick={() => handleViewOrder(order.orderId)}
                                                className="px-4 py-1 rounded-xl border border-gray-300 text-[#fc814a] hover:bg-[#e8e8e8] hover:text-[#564256] transition-colors duration-300"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Order Popup */}
                    {isPopupOpen && (
                        <OrderPopup
                            order={selectedOrder}
                            onClose={() => setIsPopupOpen(false)}
                        />
                    )}

                    {/* Pagination Controls */}
                    <div className="grid grid-cols-3 items-center w-full">
                        <div className="flex justify-center col-span-1 col-start-2">
                            <Pagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={(page) => setCurrentPage(page)}
                            />
                        </div>
                        <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                            Showing <b>{completedOrders.length}</b> of <b>{totalComOrders}</b> orders
                        </p>
                    </div>
                </section>
            ) : (
                <div className="p-4">
                    <p>No orders found matching your search or filter criteria.</p>
                </div>
            ))}
        </div>
    );
};

export default AdminOrders;
