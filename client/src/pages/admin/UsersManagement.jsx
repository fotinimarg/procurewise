import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Pencil, PlusCircle, Trash2, Share, SquarePen, Filter } from 'lucide-react';
import React, { useState, useEffect, useRef, useContext } from 'react';
import toast from 'react-hot-toast';
import Pagination from '../../components/Pagination';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import UserButton from '../../components/UserDetailsPopup';
import AuthContext from '../../../context/AuthProvider';
import ConfirmationModal from '../../components/ConfirmationModal';

const UsersManagement = () => {
    const { auth } = useContext(AuthContext);
    const [users, setUsers] = useState([]);

    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    const [searchQuery, setSearchQuery] = useState('');
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    const [showFilters, setShowFilters] = useState(false);

    const [selectedUsers, setSelectedUsers] = useState([]);
    const [showBulkActions, setShowBulkActions] = useState(false);
    const [selectedRole, setSelectedRole] = useState('');
    const [selectedStatus, setSelectedStatus] = useState('');

    const [exportOptions, setExportOptions] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalUsers, setTotalUsers] = useState(0);
    const itemsPerPage = 15;

    const dropdownRef = useRef(null);
    const dropdownRefExp = useRef(null);
    const dropdownRefFil = useRef(null);
    const buttonRef = useRef(null);
    const exportRef = useRef(null);
    const filterRef = useRef(null);

    const [sortField, setSortField] = useState("createdAt");
    const [sortOrder, setSortOrder] = useState("desc");

    const [selectedDateType, setSelectedDateType] = useState("createdAt")
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [confirmAction, setConfirmAction] = useState(() => { });
    const [modalMessage, setModalMessage] = useState("");

    const [userForm, setUserForm] = useState({
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        status: 'active'
    });

    const fetchUsers = async (page = 1, limit = itemsPerPage) => {
        try {
            const response = await axios.get('/user/admin',
                {
                    params: { page, limit, roleFilter, statusFilter, searchQuery: debouncedSearchQuery, sortField, sortOrder, dateType: selectedDateType, dateFrom, dateTo }
                }
            );
            setUsers(response.data.users);
            setTotalUsers(response.data.totalUsers);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error('Error fetching products:', error);
        }
    }

    useEffect(() => {
        fetchUsers(currentPage, itemsPerPage);
    }, [currentPage])

    useEffect(() => {
        setCurrentPage(1);
        fetchUsers(1, itemsPerPage);
    }, [debouncedSearchQuery, sortField, sortOrder])

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

    const resetFilters = () => {
        setRoleFilter("");
        setStatusFilter("");
        setDateFrom("");
        setDateTo("");
        setCurrentPage(1);
    }

    const handleSort = (field) => {
        setSortOrder((prevOrder) => (sortField === field ? (prevOrder === "asc" ? "desc" : "asc") : "asc"));
        setSortField(field);
    }

    const getSortIcon = (field) => {
        return sortField === field ? (sortOrder === "asc" ? "↑" : "↓") : "⇅";
    }

    // Handle adding a new user
    const handleAddUser = () => {
        setSelectedUser(null);
        setUserForm({
            firstName: '',
            lastName: '',
            username: '',
            email: '',
            password: '',
            role: 'user',
            status: 'active'
        })
        setShowModal(!showModal);
    }

    const handleChange = (e) => {
        setUserForm({ ...userForm, [e.target.name]: e.target.value });
    }

    const handleEditUser = (user) => {
        setUserForm({
            firstName: user.firstName,
            lastName: user.lastName,
            username: user.username,
            email: user.email,
            role: user.role,
            status: user.status
        });
        setSelectedUser(user);
        setShowModal(true);
    }

    // Single Delete Action
    const handleOpenModal = (id) => {
        setConfirmAction(() => () => handleDeleteUser(id));
        setModalMessage("Are you sure you want to delete this user?");
        setIsModalOpen(true);
    }

    const handleDeleteUser = async (userId) => {
        try {
            await axios.delete(`/user/${userId}`);

            fetchUsers(currentPage, itemsPerPage);
        } catch (error) {
            console.error('Error deleting user:', error);
            toast.error("Failed to delete user.");
        }
    }

    const handleSaveUser = async () => {
        try {
            if (selectedUser) {
                // Edit User
                await axios.put(`/user/admin/${selectedUser._id}`, userForm);
            } else {
                // Add User
                await axios.post('/user/admin', userForm);
            }
            toast.success("User saved successfully!");
            setShowModal(false);
            fetchUsers();
        } catch (error) {
            console.error('Error saving user:', error);
            if (error.response && error.response.data && error.response.data.error) {
                toast.error(error.response.data.error);
            } else {
                toast.error('Failed to save user. Please try again.');
            }
        }
    }

    // Toggle user selection
    const handleUserSelection = (userId) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    }

    // Select/Deselect all users
    const handleSelectAll = () => {
        if (selectedUsers.length === users.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(users.map((user) => user._id));
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
        if (selectedUsers.length === 0) {
            toast.error("No users selected for deletion.");
            return;
        }
        setConfirmAction(() => handleBulkDelete);
        setModalMessage(`Are you sure you want to delete ${selectedUsers.length} users? This action cannot be undone.`);
        setIsModalOpen(true);
    }

    // Bulk delete selected users
    const handleBulkDelete = async () => {
        if (selectedUsers.length === 0) {
            toast.error("No users selected for deletion.");
            return;
        }

        setIsModalOpen(false);

        try {
            await axios.delete('/user/admin/bulk-delete', { data: { userIds: selectedUsers } });

            setUsers(users.filter((user) => !selectedUsers.includes(user._id)));

            setSelectedUsers([]);
            toast.success("Selected users deleted successfully!");
        } catch (error) {
            console.error("Error deleting users:", error);
            toast.error("Failed to delete users.");
        }
    }

    const handleBulkUpdateRole = async () => {
        if (selectedUsers.length === 0) {
            toast.error("No users selected for role update.");
            return;
        }

        if (!selectedRole) {
            toast.error("Please select a role.");
            return;
        }

        try {
            await axios.put('/user/admin/bulk-update-role', {
                userIds: selectedUsers,
                newRole: selectedRole
            });

            setUsers(users.map(user =>
                selectedUsers.includes(user._id) ? { ...user, role: selectedRole } : user
            ));

            setSelectedUsers([]);
            setSelectedRole('');
            toast.success("User roles updated successfully!");
        } catch (error) {
            console.error("Error updating roles:", error);
            toast.error("Failed to update user roles.");
        }
    }

    const handleBulkUpdateStatus = async () => {
        if (selectedUsers.length === 0) {
            toast.error("No users selected for status update.");
            return;
        }

        if (!selectedStatus) {
            toast.error("Please select a status.");
            return;
        }

        try {
            await axios.put('/user/admin/bulk-update-status', {
                userIds: selectedUsers,
                newStatus: selectedStatus,
            });

            setUsers(users.map(user =>
                selectedUsers.includes(user._id) ? { ...user, status: selectedStatus } : user
            ));

            setSelectedUsers([]);
            setSelectedStatus('');
            toast.success("User statuses updated successfully!");
        } catch (error) {
            console.error("Error updating statuses:", error);
            toast.error("Failed to update user statuses.");
        }
    }

    const exportUsersToCSV = async (selectedUserIds, exportType) => {
        try {
            if (exportType === 'selected' && selectedUserIds.length === 0) {
                toast.error('No selected users.');
                return;
            }

            const response = await axios.post('/user/admin/export-users',
                {
                    userIds: selectedUserIds,
                    exportType,
                    roleFilter,
                    searchQuery,
                    statusFilter,
                    dateFrom,
                    dateTo,
                    currentPage,
                    itemsPerPage
                },
                { responseType: 'blob' }
            );

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', 'users.csv');
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error('Error exporting users:', error);
            toast.error('Failed to export users.');
        }
    }

    return (
        <div className="mx-auto p-6 max-w-screen-xl">
            <div className='flex flex-col justify-between relative mb-3'>
                <h1 className="text-2xl font-semibold mb-2">Users Management</h1>
                <div className='flex justify-between items-end relative'>
                    <div className='flex gap-4 -mb-2 ml-1 items-start'>
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
                                        className="absolute left-0 ml-10 mt-[-110px] w-48 bg-white rounded-xl shadow-lg z-50 py-1"
                                    >
                                        <button
                                            onClick={handleOpenBulkModal}
                                            className="flex items-start w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            <Trash2 size={16} />
                                            Bulk Delete
                                        </button>
                                        {/* Bulk Update Role */}
                                        <div className="px-4 py-2 border-b">
                                            <select
                                                className="w-full mt-1 border rounded-lg px-2 py-1 text-sm"
                                                value={selectedRole}
                                                onChange={(e) => setSelectedRole(e.target.value)}
                                            >
                                                <option value="">Select Role</option>
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                                <option value="moderator">Moderator</option>
                                            </select>
                                            <button
                                                onClick={handleBulkUpdateRole}
                                                className="w-full mt-2 text-sm bg-[#fc814a] hover:bg-[#fc5f18] text-white rounded-lg px-3 py-1 transition-colors duration-200"
                                            >
                                                Apply Role
                                            </button>
                                        </div>

                                        {/* Bulk Update Status */}
                                        <div className="px-4 py-2">
                                            <select
                                                className="w-full mt-1 border rounded-lg px-2 py-1 text-sm"
                                                value={selectedStatus}
                                                onChange={(e) => setSelectedStatus(e.target.value)}
                                            >
                                                <option value="">Select Status</option>
                                                <option value="active">Active</option>
                                                <option value="inactive">Inactive</option>
                                                <option value="banned">Banned</option>
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
                                            onClick={() => exportUsersToCSV([], 'all')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export All
                                        </button>
                                        <button
                                            onClick={() => exportUsersToCSV(selectedUsers.length > 0 ? selectedUsers : [], 'selected')}
                                            className="flex items-center w-full gap-2 px-4 py-2 text-sm hover:text-[#fc814a] transition-colors duration-200 border-b"
                                        >
                                            Export Selected
                                        </button>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {selectedUsers.length > 0 && (
                            <p className='text-[#564256] font-medium text-base mt-0.5'>Selected: {selectedUsers.length}</p>
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
                                    {/* Role Filter */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium">Role</label>
                                        <select
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="w-full mt-1 border rounded-xl px-2 py-1 text-sm"
                                        >
                                            <option value="">All</option>
                                            <option value="user">User</option>
                                            <option value="admin">Admin</option>
                                            <option value="moderator">Moderator</option>
                                        </select>
                                    </div>

                                    {/* Status Filter */}
                                    <div className="mb-3">
                                        <label className="block text-sm font-medium">Status</label>
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full mt-1 border rounded-xl px-2 py-1 text-sm"
                                        >
                                            <option value="">All</option>
                                            <option value="active">Active</option>
                                            <option value="inactive">Inactive</option>
                                            <option value="banned">Banned</option>
                                        </select>
                                    </div>

                                    {/* Date Registered/Logged In Filter */}
                                    <select
                                        value={selectedDateType}
                                        onChange={(e) => setSelectedDateType(e.target.value)}
                                        className="w-full mt-1 border rounded-xl px-2 py-1 text-sm mb-2">
                                        <option value="createdAt">Registered Date</option>
                                        <option value="lastLogin">Last Login Date</option>
                                    </select>

                                    <div>
                                        <label className="block text-sm font-medium">From</label>
                                        <DatePicker
                                            selected={dateFrom}
                                            onChange={(date) => setDateFrom(date)}
                                            placeholderText="Select a date"
                                            className="px-3 py-1 focus:outline-none border rounded-xl"
                                            dateFormat="dd/MM/yyyy"
                                            isClearable={!!dateFrom}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mt-2">To</label>
                                        <DatePicker
                                            selected={dateTo}
                                            onChange={(date) => setDateTo(date)}
                                            placeholderText="Select a date"
                                            className="px-3 py-1 focus:outline-none border rounded-xl"
                                            dateFormat="dd/MM/yyyy"
                                            isClearable={!!dateTo}
                                        />
                                    </div>

                                    {/* Apply & Reset Buttons */}
                                    <div className="flex justify-between mt-3">
                                        <button
                                            onClick={() => { fetchUsers(1, itemsPerPage); setCurrentPage(1); setShowFilters(false); }}
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
                            onClick={handleAddUser}
                            className="bg-[#564256] hover:bg-[#392339] text-sm text-white rounded-full px-4 py-1.5 transition-colors duration-300 flex gap-2 items-center">
                            <PlusCircle size={18} />
                            <span>New</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Users Table */}
            <table className="table-auto w-full bg-white rounded-xl shadow-md text-center">
                <thead>
                    <tr className="bg-[#e8e8e8]">
                        <th className="px-4 py-2">
                            <input
                                name='check'
                                type="checkbox"
                                checked={selectedUsers.length === users.length && users.length > 0}
                                onChange={handleSelectAll}
                            />
                        </th>
                        <th className="px-4 py-2">Name</th>
                        <th className="px-4 py-2">Username</th>
                        <th className="px-4 py-2">Email</th>
                        <th className="px-2 py-2">Role</th>
                        <th className="px-4 py-2">Status</th>
                        <th
                            onClick={() => handleSort("createdAt")}
                            className="px-4 py-2 cursor-pointer"
                        >
                            Registered {getSortIcon("createdAt")}
                        </th>
                        <th
                            onClick={() => handleSort("lastLogin")}
                            className="px-4 py-2 cursor-pointer"
                        >
                            Last Login {getSortIcon("lastLogin")}
                        </th>
                        <th className="px-2 py-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user._id} className="border-b">
                            <td className="p-2">
                                <input
                                    name='check'
                                    type="checkbox"
                                    checked={selectedUsers.includes(user._id)}
                                    onChange={() => handleUserSelection(user._id)}
                                />
                            </td>
                            <td className="px-4 py-2">{user.fullName}</td>
                            <td className="px-4 py-2">{user.username}</td>
                            <td className="px-4 py-2">{user.email}</td>
                            <td className={`px-2 py-2 ${user.role === 'admin' ? 'font-semibold' : ''}`}>{user.role}</td>
                            <td className={`px-4 py-2 ${user.status === 'banned' ? 'text-red-500 font-semibold' : `${user.status === 'inactive' ? 'text-yellow-500 font-semibold' : 'text-green-500 font-semibold'}`}`}>
                                {user.status}
                            </td>
                            <td className="px-4 py-2">
                                <div>{new Date(user.createdAt).toLocaleDateString()}
                                </div>
                                <div className="text-gray-600">{new Date(user.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </td>
                            <td className="px-4 py-2">
                                <div>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : ''}
                                </div>
                                <div className="text-gray-600">{user.lastLogin ? new Date(user.lastLogin).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                                </div>
                            </td>
                            <td className="px-2 py-2 flex items-center gap-2 justify-center">
                                <UserButton user={user} />

                                {(auth.user.id === user._id || user.role !== 'admin') && (
                                    <button
                                        onClick={() => handleEditUser(user)}
                                        className="text-gray-500 hover:text-gray-800 transition-colors duration-300"
                                    >
                                        <Pencil size={21} />
                                    </button>
                                )}

                                {user.role !== 'admin' && (
                                    <button
                                        onClick={() => handleOpenModal(user._id)}
                                        className="text-gray-500 hover:text-red-600 transition-colors duration-300">
                                        <Trash2 size={21} />
                                    </button>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="grid grid-cols-3 items-center w-full">
                <div className="flex justify-center col-span-1 col-start-2">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={(page) => setCurrentPage(page)}
                    />
                </div>
                <p className="col-span-1 text-gray-800 text-right mt-6 col-start-3">
                    Showing <b>{users.length}</b> of <b>{totalUsers}</b> users
                </p>
            </div>

            {/* Add/Edit User Modal */}
            {showModal && (
                <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white rounded-xl shadow-lg py-6 px-10 relative w-auto max-h-[90vh] overflow-auto">
                        <button
                            className='absolute top-2 right-3 text-gray-500 hover:text-gray-800'
                            onClick={() => {
                                handleAddUser();
                                setUserForm({
                                    firstName: '',
                                    lastName: '',
                                    username: '',
                                    email: '',
                                    password: '',
                                    role: 'user',
                                    status: 'active'
                                });
                                setSelectedUser(null);
                            }}>
                            ×
                        </button>
                        <h2 className="mb-8 text-xl text-center font-bold text-[#fc814a]">{selectedUser ? 'Edit User' : 'Add User'}</h2>
                        <div className="space-y-4">
                            <label className="block text-gray-700">First Name
                                <input
                                    type="text"
                                    name="firstName"
                                    value={userForm.firstName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                />
                            </label>
                            <label className="block text-gray-700">Last Name
                                <input
                                    type="text"
                                    name="lastName"
                                    value={userForm.lastName}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                />
                            </label>
                            <label className="block text-gray-700">Username
                                <input
                                    type="text"
                                    name="username"
                                    value={userForm.username}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                />
                            </label>

                            <label className="block text-gray-700">Email
                                <input
                                    type="email"
                                    name="email"
                                    value={userForm.email}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                />
                            </label>
                            {!selectedUser ?
                                <label className="block text-gray-700">Password
                                    <input
                                        type="password"
                                        name="password"
                                        value={null}
                                        onChange={handleChange}
                                        className="w-full px-3 py-2 border rounded-xl bg-gray-50"
                                    />
                                </label>
                                : ''
                            }
                            {userForm.role !== 'admin' ? (
                                <label className="block text-gray-700">Role
                                    <select
                                        name="role"
                                        value={userForm.role}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                    >
                                        <option value="user">User</option>
                                        <option value="admin">Admin</option>
                                        <option value="moderator">Moderator</option>
                                    </select>
                                </label>
                            ) : ''}

                            {selectedUser && userForm.role !== 'admin' ? (
                                <label className="block text-gray-700">Status
                                    <select
                                        name="status"
                                        value={userForm.status}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-xl"
                                    >
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                        <option value="banned">Banned</option>
                                    </select>
                                </label>
                            ) : ''}
                        </div>
                        <div className="mt-4">
                            <button
                                onClick={handleSaveUser}
                                className="w-full bg-[#564256] text-white py-2 rounded-xl hover:bg-[#96939b] transition-colors duration-300">
                                Save
                            </button>
                        </div>
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
        </div>
    );
}

export default UsersManagement;