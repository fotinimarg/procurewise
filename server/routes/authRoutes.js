const express = require('express');
const router = express.Router();
const { registerUser, loginUser, getAuth, verifyEmail, forgotPassword, resetPassword } = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');
const { logoutSession } = require('../controllers/userController');
const User = require('../models/user');

// Register new user
router.post('/register', registerUser)

// Login user
router.post('/login', loginUser)

// Get authorized user
router.get('/auth/me', getAuth)

// Verify user's email
router.post("/verify-email", verifyEmail)

// User forgot his password
router.post('/forgot-password', forgotPassword)

// Reset password
router.post('/reset-password', resetPassword)

// Logout user
router.post('/logout', verifyToken, async (req, res) => {
    try {
        await logoutSession(req, res);

        // Using Passport's function
        req.logOut((err) => {
            if (err) {
                return res.status(500).json({ error: 'Logout failed' });
            }

            return res.json({ message: 'Logged out successfully' });
        });
    } catch (err) {
        console.error('Logout error:', err);
        res.status(500).json({ error: 'Logout failed.' });
    }
})

module.exports = router
