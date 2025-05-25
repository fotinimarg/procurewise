const jwt = require('jsonwebtoken');
const User = require('../models/user');
const Session = require('../models/session');
const { v4: uuidv4 } = require('uuid');

const verifyToken = async (req, res, next) => {
    const { token } = req.cookies;

    if (!token) {
        return res.status(403).json({ message: 'Unauthorized request.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Check if the token exists in the session collection
        const session = await Session.findOne({ userId: decoded.UserInfo.id, token });

        if (!session) {
            return res.status(401).json({ message: 'Invalid or expired session!' });
        }

        req.user = decoded.UserInfo;
        next();
    } catch (error) {
        console.error('Token verification failed:', error);
        return res.status(401).json({ message: 'Invalid token!' });
    }
}

const verifyAdmin = async (req, res, next) => {
    try {
        const { token } = req.cookies;

        if (!token) {
            return res.status(401).json({ message: 'Unauthorized request.' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.UserInfo;

        // Find user and check if they are an admin
        const user = await User.findById(req.user.id);
        if (!user || user.role !== 'admin') {
            return res.status(403).json({ message: 'Forbidden: Admins only' });
        }

        req.user = user;
        next();
    } catch (error) {
        console.log('Error verifying admin:', error.message);
        res.status(500).json({ message: 'Server error' });
    }
}

const verifyUserOrGuest = async (req, res, next) => {
    const { token, guestId } = req.cookies;

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Check if the session exists and is valid
            const session = await Session.findOne({ userId: decoded.UserInfo.id, token });

            if (!session) {
                return res.status(401).json({ message: 'Invalid or expired session!' });
            }

            req.user = decoded.UserInfo;
            return next();
        } catch (error) {
            console.error('Token verification failed:', error);
            return res.status(401).json({ message: 'Invalid token!' });
        }
    }

    if (guestId) {
        req.guestId = guestId;
        return next();
    }

    return res.status(403).json({ message: 'Unauthorized request. Please log in or continue as a guest.' });
}

const assignGuestId = (req, res, next) => {
    if (!req.cookies.guestId && !req.cookies.token) {
        const guestId = uuidv4(); // Generate a unique ID for the guest
        res.cookie('guestId', guestId, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
        req.guestId = guestId;
    } else {
        req.guestId = req.cookies.guestId;
    }
    next();
}

module.exports = {
    verifyToken,
    verifyAdmin,
    verifyUserOrGuest,
    assignGuestId
}