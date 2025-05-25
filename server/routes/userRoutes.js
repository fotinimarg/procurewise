const express = require('express');
const router = express.Router();
const upload = require('../config/multer');
const { deleteUser, getUserById, updateUser, getAddress, addAddress, deleteAddress, updateAddress, makePrimary, getNumber, addNumber, updateNumber, deleteNumber, uploadProfilePicture, changePassword, logoutAll, getUsers, addUser, editUser, logoutFromOtherDevices, exportUsers, bulkDelete, bulkUpdateRole, bulkUpdateStatus, getActiveUsersCount, getNewUsers, getRecentActions } = require('../controllers/userController');
const { verifyToken, verifyAdmin } = require('../middleware/authMiddleware')

// Get user's profile
router.get('/profile', verifyToken, getUserById)

// Add new user
router.post('/admin', verifyAdmin, addUser)

// Update user data
router.put('/update', verifyToken, updateUser)

// Delete user
router.delete('/:id', verifyToken, deleteUser)

// Get addresses of a user
router.get('/address', verifyToken, getAddress)

// Add new address
router.post('/address', verifyToken, addAddress)

// Update address
router.put('/address', verifyToken, updateAddress)

// Make an address primary
router.put('/address/primary', verifyToken, makePrimary)

// Delete an address
router.delete('/address/:addressId', verifyToken, deleteAddress)

// Get phone numbers of user
router.get('/phone-number', verifyToken, getNumber)

// Add new number
router.post('/phone-number', verifyToken, addNumber)

// Update number
router.put('/phone-number', verifyToken, updateNumber)

// Delete a number
router.delete('/phone-number/:id', verifyToken, deleteNumber)

// Update profile picture
router.post('/profile-picture', verifyToken, upload.single('profilePicture'), uploadProfilePicture);

// Change password
router.post('/password', verifyToken, changePassword);

// Logout from other devices
router.post('/logout-other-devices', verifyToken, logoutFromOtherDevices);

// Logout from all devices
router.post('/logout-all', verifyToken, logoutAll);

// Get all users - admin
router.get('/admin', verifyAdmin, getUsers);

// Export users
router.post('/admin/export-users', verifyAdmin, exportUsers);

// Bulk-delete users
router.delete('/admin/bulk-delete', verifyAdmin, bulkDelete);

// Bulk-update users' role
router.put('/admin/bulk-update-role', verifyAdmin, bulkUpdateRole);

// Bulk-update users' status
router.put('/admin/bulk-update-status', verifyAdmin, bulkUpdateStatus);

// Edit user data
router.put('/admin/:id', verifyAdmin, editUser)

// Get active users count
router.get('/admin/active-users-count', verifyAdmin, getActiveUsersCount)

// Get new users for the last 7 days
router.get('/admin/new-users', verifyAdmin, getNewUsers)

// Get recent orders and favorites of a user
router.get('/:userId/recent-actions', verifyAdmin, getRecentActions)

module.exports = router;