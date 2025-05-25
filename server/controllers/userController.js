const User = require('../models/user');
const mongoose = require('mongoose');
const { getStorage } = require('firebase-admin/storage');
const admin = require('../config/firebaseAdmin');
const Session = require('../models/session');
const { Parser } = require('json2csv');
const Favorite = require('../models/favorite');
const Review = require('../models/review');
const Order = require('../models/order');
const { generateVerificationEmail } = require('../helpers/emailUtils');
const sendEmail = require('../config/mailer');
const jwt = require('jsonwebtoken');

const getUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const { statusFilter, roleFilter, searchQuery, sortField = "createdAt", sortOrder = "desc", dateType, dateFrom, dateTo } = req.query;

        let filters = {};

        // Apply role and status filtering
        if (roleFilter) {
            filters.role = roleFilter;
        }
        if (statusFilter) {
            filters.status = statusFilter;
        }

        // Apply date range filter if provided
        if (dateType && (dateFrom || dateTo)) {
            if (dateType === 'createdAt') {
                if (!dateTo) {
                    filters.createdAt = {
                        $gte: new Date(dateFrom)
                    }
                } else if (!dateFrom) {
                    filters.createdAt = {
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                } else {
                    filters.createdAt = {
                        $gte: new Date(dateFrom),
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                }
            } else {
                if (!dateTo) {
                    filters.lastLogin = {
                        $gte: new Date(dateFrom)
                    }
                } else if (!dateFrom) {
                    filters.lastLogin = {
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                } else {
                    filters.lastLogin = {
                        $gte: new Date(dateFrom),
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                }
            }
        }

        // Apply search query
        if (searchQuery) {
            filters.$or = [
                { firstName: { $regex: new RegExp(searchQuery, "i") } },
                { lastName: { $regex: new RegExp(searchQuery, "i") } },
                { username: { $regex: new RegExp(searchQuery, "i") } },
                { email: { $regex: new RegExp(searchQuery, "i") } }
            ];
        }

        // Sort by date registered or last logged in
        const sortOptions = {};
        sortOptions[sortField] = sortOrder === "asc" ? 1 : -1;

        const users = await User.find(filters)
            .select('-password')
            .skip(skip)
            .limit(limit)
            .sort({ ...sortOptions, firstName: 1, lastName: 1 })
            .lean();

        const totalUsers = await User.countDocuments(filters);
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            users: users,
            totalUsers,
            totalPages,
            currentPage: page
        });
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch users' });
    }
}

const exportUsers = async (req, res) => {
    let { userIds, exportType, statusFilter, roleFilter, searchQuery, dateType, dateFrom, dateTo } = req.body;

    try {
        let users;

        let filters = {};

        // Apply role and status filtering
        if (roleFilter) {
            filters.role = roleFilter;
        }
        if (statusFilter) {
            filters.status = statusFilter;
        }

        // Apply date range filter if provided
        if (dateType && (dateFrom || dateTo)) {
            if (dateType === 'createdAt') {
                if (!dateTo) {
                    filters.createdAt = {
                        $gte: new Date(dateFrom)
                    }
                } else if (!dateFrom) {
                    filters.createdAt = {
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                } else {
                    filters.createdAt = {
                        $gte: new Date(dateFrom),
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                }
            } else {
                if (!dateTo) {
                    filters.lastLogin = {
                        $gte: new Date(dateFrom)
                    }
                } else if (!dateFrom) {
                    filters.lastLogin = {
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                } else {
                    filters.lastLogin = {
                        $gte: new Date(dateFrom),
                        $lte: new Date(new Date(dateTo).setHours(23, 59, 59, 999))
                    }
                }
            }
        }
        // Apply search filtering
        if (searchQuery) {
            filters.$or = [
                { firstName: { $regex: new RegExp(searchQuery, "i") } },
                { lastName: { $regex: new RegExp(searchQuery, "i") } },
                { username: { $regex: new RegExp(searchQuery, "i") } },
                { email: { $regex: new RegExp(searchQuery, "i") } }
            ];
        }

        if (exportType === 'all') {
            // Export all users that match the filters
            users = await User.find(filters, { password: 0, profilePicture: 0, __v: 0 })
                .sort({ firstName: 1, lastName: 1 })
                .lean();
        } else if (exportType === 'selected') {
            if (userIds && Array.isArray(userIds) && userIds.length > 0) {
                // Fetch only selected users
                users = await User.find(
                    { _id: { $in: userIds } },
                    { password: 0, profilePicture: 0, __v: 0 }
                )
                    .sort({ firstName: 1, lastName: 1 })
                    .lean();
            }
        } else {
            const { currentPage = 1, itemsPerPage = 20 } = req.body;
            users = await User.find(filters, { password: 0, profilePicture: 0, __v: 0 })
                .skip((currentPage - 1) * itemsPerPage)
                .limit(Number(itemsPerPage))
                .sort({ firstName: 1, lastName: 1 })
                .lean();
        }

        if (!users.length) {
            return res.status(404).json({ message: "No users found." });
        }

        // Convert the users array to CSV format
        const fields = [
            { label: 'User ID', value: '_id' },
            { label: 'First Name', value: 'firstName' },
            { label: 'Last Name', value: 'lastName' },
            { label: 'Username', value: 'username' },
            { label: 'Email', value: 'email' },
            { label: 'Business Name', value: row => row.businessName || 'N/A' },
            { label: 'Address', value: row => row.address || 'N/A' },
            { label: 'Phone Number', value: row => row.phoneNumber || 'N/A' },
            { label: 'VAT Number', value: row => row.vatNumber || 'N/A' },
            { label: 'Role', value: 'role' },
            { label: 'Status', value: 'status' },
            { label: 'Last Login', value: row => row.lastLogin ? new Date(row.lastLogin).toLocaleString() : 'Never' },
            { label: 'Account Created At', value: row => new Date(row.createdAt).toLocaleString() }
        ];

        const json2csvParser = new Parser({ fields });
        const csv = json2csvParser.parse(users);

        res.header('Content-Type', 'text/csv');
        res.attachment('users.csv');
        res.send(csv);
    }
    catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch users' });
    }
}

// Add a new user (Admin)
const addUser = async (req, res) => {
    try {
        const { firstName, lastName, username, email, password, role } = req.body;

        // Check if username was entered and if it's correct format
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (!username || !usernameRegex.test(username)) {
            return res.status(400).json({
                error: 'Username is required and can only contain letters, numbers, ".", "-", or "_"'
            })
        }

        // Check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({
                error: 'A valid email is required'
            });
        }

        let existingUser;
        existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        existingUser = await User.findOne({ username });
        if (existingUser) {
            return res.status(400).json({ error: 'Username already in use' });
        }

        // Check if password is good
        if (!password || password.length < 8) {
            return res.status(400).json({
                error: 'Password is required and should be at least 8 characters long'
            })
        }

        // Check if name is good
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
        if (!firstName || !nameRegex.test(firstName) || !lastName || !nameRegex.test(lastName)) {
            return res.status(400).json({
                error: 'First name and last name are required and should only contain letters and spaces'
            });
        }

        // Capitalize the first letter of each name
        const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

        const newUser = new User({
            firstName,
            lastName,
            fullName: `${formattedFirstName} ${formattedLastName}`,
            username,
            email,
            role,
            status: 'active'
        });

        const registeredUser = await User.register(newUser, password);

        // Generate a verification token
        const verificationToken = jwt.sign(
            { userId: registeredUser._id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        registeredUser.verificationToken = verificationToken;
        await registeredUser.save();

        // Send verification email
        const { subject, html } = generateVerificationEmail(registeredUser, verificationToken);
        await sendEmail(registeredUser.email, subject, html);

        const { salt, hash, ...userWithoutPassword } = registeredUser._doc;

        return res.status(201).json(userWithoutPassword);
    } catch (error) {
        console.error('Error adding user:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

// Edit an existing user (Admin)
const editUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, username, email, role, status, password } = req.body;

        let user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if username was entered and if it's correct format
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (username && username !== user.username) {
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    error: 'Username can only contain letters, numbers, ".", "-", or "_"'
                })
            }
            const existingUser = await User.findOne({ username, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).send({ error: 'Username is already in use.' });
            }
        }

        // Check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && email !== user.email) {
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'A valid email is required'
                });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }
        }

        // Check if name is good
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
        if (firstName && !nameRegex.test(firstName) || lastName && !nameRegex.test(lastName)) {
            return res.status(400).json({
                error: 'First name and last name should only contain letters and spaces'
            });
        }

        // Capitalize the first letter of each name
        const formattedFirstName = firstName.charAt(0).toUpperCase() + firstName.slice(1);
        const formattedLastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

        user.firstName = formattedFirstName || user.firstName;
        user.lastName = formattedLastName || user.lastName;
        user.fullName = `${formattedFirstName} ${formattedLastName}` || user.fullName;
        user.username = username || user.username;
        user.email = email || user.email;
        user.role = role || user.role;
        user.status = status || user.status;

        if (password) {
            await user.setPassword(password);
        }

        await user.save();

        // If the user is banned, delete all their active sessions
        if (status === 'banned') {
            await Session.deleteMany({ userId: id });
        }

        const { salt, hash, ...updatedUser } = user._doc;

        return res.json(updatedUser);
    } catch (error) {
        console.error('Error editing user:', error);
        return res.status(500).json({ error: 'Server error' });
    }
}

const getUserById = async (req, res) => {
    try {
        const { id } = req.user;

        const user = await User.findById(id);
        if (!user) {
            res.status(404).send({ message: 'User not found.' })
        }
        res.status(200).send(user)
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to fetch user' });
    }
}

const updateUser = async (req, res) => {
    try {
        const { id } = req.user;
        const { firstName, lastName, username, email, businessName } = req.body;

        // Fetch the current user
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).send({ message: 'User not found.' });
        }

        const updatedFields = {};

        // Check if username was entered and if it's correct format
        const usernameRegex = /^[a-zA-Z0-9._-]+$/;
        if (username && username !== user.username) {
            if (!usernameRegex.test(username)) {
                return res.status(400).json({
                    error: 'Username can only contain letters, numbers, ".", "-", or "_"'
                })
            }
            const existingUser = await User.findOne({ username, _id: { $ne: id } });
            if (existingUser) {
                return res.status(400).send({ error: 'Username is already in use.' });
            }

            updatedFields.username = username;
        }

        // Check email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (email && email !== user.email) {
            if (!emailRegex.test(email)) {
                return res.status(400).json({
                    error: 'A valid email is required'
                });
            }
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ error: 'Email already in use' });
            }

            updatedFields.email = email;
        }

        // Check if name is good
        const nameRegex = /^[a-zA-ZÀ-ÿ\s]+$/;
        if (firstName && !nameRegex.test(firstName) || lastName && !nameRegex.test(lastName)) {
            return res.status(400).json({
                error: 'First name and last name should only contain letters and spaces'
            });
        }

        const formattedFirstName = firstName
            ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
            : user.firstName; // Use existing firstName if not provided
        const formattedLastName = lastName
            ? lastName.charAt(0).toUpperCase() + lastName.slice(1)
            : user.lastName; // Use existing lastName if not provided

        updatedFields.firstName = formattedFirstName;
        updatedFields.lastName = formattedLastName;
        updatedFields.fullName = `${formattedFirstName} ${formattedLastName}`;

        if (businessName) updatedFields.businessName = businessName;

        const updatedUser = await User.findByIdAndUpdate(id, updatedFields, { new: true });

        if (!updatedUser) {
            res.status(404).send({ message: 'User not found.' })
        }

        res.status(200).send({ message: 'User updated successfully.', user: updatedUser })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to update user' });
    }
}

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        console.log(req.params);
        console.log(userId);

        // Delete all sessions
        await Session.deleteMany({ userId: id });

        // Delete favorites
        await Favorite.deleteMany({ user: id });

        // Unlink reviews
        await Review.updateMany({ user: id }, { user: null });

        // Unlink orders
        await Order.updateMany({ user: id }, { user: null });

        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
            return res.status(404).send({ error: 'User not found.' })
        }

        if (id === userId) {
            res.clearCookie('token');
        }
        res.status(200).send({ message: 'User deleted successfully.', user: deletedUser })
    } catch (error) {
        console.log(error.message);
        res.status(500).send({ error: 'Failed to delete user' });
    }
}

const getAddress = async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('address');
        res.json(user.address);
    } catch (error) {
        console.log('Error fetching address:', error.message);
        res.status(500).json({ message: 'Failed to fetch address' });
    }
}

const addAddress = async (req, res) => {
    try {
        const { address } = req.body;
        const user = await User.findById(req.user.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const isPrimary = user.address.length === 0;

        const newAddress = {
            ...address,
            _id: new mongoose.Types.ObjectId(),
            isPrimary,
        };

        user.address.push(newAddress);
        await user.save();

        res.status(201).json({ message: 'Address added successfully', address: user.address });
    } catch (error) {
        console.log('Error adding address:', error.message);
        res.status(500).json({ message: 'Failed to add address' });
    }
}

const updateAddress = async (req, res) => {
    const { id, address } = req.body;
    const { street, city, postalCode, region } = address;
    const userId = req.user.id;

    try {
        if (!id || !address) {
            return res.status(400).json({ message: 'Address ID and new address details are required.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, "address._id": id },
            {
                $set: {
                    "address.$.street": street,
                    "address.$.city": city,
                    "address.$.postalCode": postalCode,
                    "address.$.region": region
                }
            },
            { new: true }
        )

        if (!user) {
            return res.status(404).json({ message: "User or address not found" });
        }

        res.json({ message: "Address updated successfully", address: user.address });
    } catch (error) {
        console.log("Error updating address:", error.message);
        res.status(500).json({ message: "Failed to update address" });
    }
}

// Make an address primary
const makePrimary = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.body;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.address.forEach((address) => {
            address.isPrimary = address._id.toString() === id;
        });

        await user.save();

        res.status(200).json({ message: 'Primary address updated successfully', addresses: user.address })
    } catch (error) {
        res.status(500).json({ error: 'Failed to update primary address' });
    }
}

const deleteAddress = async (req, res) => {
    const userId = req.user.id;
    const { addressId } = req.params;

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Find the address being deleted
        const deletedAddress = user.address.find((addr) => addr._id.toString() === addressId);

        if (!deletedAddress) {
            return res.status(404).json({ message: "Address not found" });
        }

        await User.findByIdAndUpdate(
            userId,
            { $pull: { address: { _id: addressId } } },
            { new: true }
        )

        // If the deleted address was primary
        if (deletedAddress.isPrimary) {
            const updatedUser = await User.findById(userId);

            // Set the first remaining address as primary
            if (updatedUser.address.length > 0) {
                updatedUser.address[0].isPrimary = true;
                await updatedUser.save();
            }
        }

        res.json({ message: "Address deleted successfully", addresses: user.address });
    } catch (error) {
        console.log("Error deleting address:", error.message);
        res.status(500).json({ message: "Failed to delete address" });
    }
}

const getNumber = async (req, res) => {
    const userId = req.user.id;

    try {
        const user = await User.findById(userId).select('phoneNumber');
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.phoneNumber);
    } catch (error) {
        console.log('Error fetching phone numbers:', error.message);
        res.status(500).json({ message: 'Failed to fetch phone numbers' });
    }
}

const addNumber = async (req, res) => {
    const userId = req.user.id;
    const { phoneNumber } = req.body;

    try {
        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { phoneNumber: { number: phoneNumber } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ phoneNumber: user.phoneNumber });
    } catch (error) {
        console.log('Error adding phone number:', error.message);
        res.status(500).json({ message: 'Failed to add phone number' });
    }
}

const updateNumber = async (req, res) => {
    const userId = req.user.id;
    const { id, phoneNumber } = req.body;

    try {
        if (!id || !phoneNumber) {
            return res.status(400).json({ message: 'Phone number ID and new phone number are required.' });
        }

        const user = await User.findOneAndUpdate(
            { _id: userId, 'phoneNumber._id': id },
            { $set: { 'phoneNumber.$.number': phoneNumber } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User or phone number not found' });
        }

        res.json(user.phoneNumber);
    } catch (error) {
        console.log('Error updating phone number:', error.message);
        res.status(500).json({ message: 'Failed to update phone number' });
    }
}

const deleteNumber = async (req, res) => {
    const userId = req.user.id;
    const { id } = req.params;

    try {
        const user = await User.findOneAndUpdate(
            { _id: userId },
            { $pull: { phoneNumber: { _id: id } } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User or phone number not found' });
        }

        res.json(user.phoneNumber);
    } catch (error) {
        console.log('Error deleting phone number:', error.message);
        res.status(500).json({ message: 'Failed to delete phone number.' });
    }
}

// Set default profile picture
const DEFAULT_AVATAR_URL = `${process.env.FRONTEND_BASE_URL}/default-avatar.png`;

const isDefaultAvatar = (profilePicture) => {
    return profilePicture === DEFAULT_AVATAR_URL;
};
const uploadProfilePicture = async (req, res) => {
    try {
        // Check if an image URL is provided
        const { imageUrl } = req.body;

        if (imageUrl) {
            const user = await User.findByIdAndUpdate(
                req.user.id,
                { profilePicture: imageUrl },
                { new: true }
            );

            return res.status(200).json({
                message: 'Profile picture updated successfully.',
                user,
            });
        }

        // If no image URL, handle file upload
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded or URL provided.' });
        }

        // Authenticate user
        const userId = req.user.id;
        const user1 = await User.findById(userId);

        if (!user1) {
            return res.status(404).json({ message: "User not found." });
        }

        // Retrieve Firebase Storage bucket
        const bucket = admin.storage().bucket();
        console.log('Current profilePicture URL:', user1.profilePicture);


        // Delete the old picture from Firebase Storage, if it exists
        if (user1.profilePicture && !isDefaultAvatar(user1.profilePicture)) {
            // Decode the URL
            const decodedUrl = decodeURIComponent(user1.profilePicture);

            // Extract the file path after 'profile-pictures/'
            const filePathMatch = decodedUrl.match(/profile-pictures\/.+$/);
            if (!filePathMatch) {
                console.warn('No valid file path found in profilePicture URL.');
            } else {
                const oldFilePath = filePathMatch[0];
                const oldFile = bucket.file(oldFilePath);

                await oldFile.delete().catch(() => {
                    console.warn('Failed to delete old picture. It might not exist.');
                });
            }
        }

        // Define a unique file name for Firebase Storage
        const fileName = `profile-pictures/${req.user.id}-${req.file.originalname}`;

        const file = bucket.file(fileName);

        // Upload the file to Firebase Storage
        await file.save(req.file.buffer, {
            metadata: {
                contentType: req.file.mimetype,
            },
        })

        // Make the file publicly accessible
        await file.makePublic();
        const publicUrl = file.publicUrl();

        // Update the user's profile picture in the database
        user1.profilePicture = publicUrl;
        await user1.save();

        return res.status(200).json({
            message: "Profile picture uploaded successfully.",
            user1,
        })
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Error uploading profile picture.' });
    }
}

const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Current password and new password are required." });
    }

    try {
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Authenticate user with current password
        User.authenticate()(user.username, currentPassword, async (err, user) => {
            if (err || !user) {
                return res.status(401).json({ message: "Current password is incorrect." });
            }

            // If authentication is successful, update the password
            try {
                await user.setPassword(newPassword);
                await user.save();

                // Delete all active sessions after password change
                await Session.deleteMany({ userId: user._id });

                res.json({ message: "Password changed successfully." });
            } catch (saveError) {
                console.error("Error saving new password:", saveError);
                res.status(500).json({ message: "Failed to update password." });
            }
        });
    } catch (error) {
        console.log("Error processing password change:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
}

const getActiveSessions = async (req, res) => {
    try {
        const sessions = await Session.find({ userId: req.user.id });
        res.json(sessions);
    } catch (error) {
        console.error('Error fetching sessions:', error);
        res.status(500).json({ message: 'Failed to retrieve sessions' });
    }
}

const logoutSession = async (req, res) => {
    try {
        const { token } = req.cookies;

        await Session.findOneAndDelete({ userId: req.user.id, token });

        //console.log('Session logged out successfully');

        res.clearCookie('token');
        res.clearCookie('guestId');
    } catch (error) {
        console.error('Logout session error:', error);
        return res.status(500).json({ message: 'Failed to log out from session' });
    }
}

const logoutFromOtherDevices = async (req, res) => {
    try {
        const { token } = req.cookies;
        const userId = req.user.id;

        // Find the current session
        const currentSession = await Session.findOne({ userId, token });

        // Remove all other sessions
        await Session.deleteMany({ userId, token: { $ne: token } });

        //console.log('Logged out from other devices successfully');

        res.clearCookie('token');
        res.json({ message: 'Logged out from other devices successfully!' });
    } catch (error) {
        console.error('Error logging out from other devices:', error);
        return res.status(500).json({ message: 'Failed to log out from other devices.' });
    }
}

// Logout from all devices
const logoutAll = async (req, res) => {
    try {
        await Session.deleteMany({ userId: req.user.id });
        res.status(200).json({ message: 'Logged out from all devices' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to log out from all devices' });
    }
}

const bulkDelete = async (req, res) => {
    try {
        const { userIds } = req.body;
        if (!userIds || userIds.length === 0) {
            return res.status(400).json({ message: "No users selected for deletion." });
        }

        await User.deleteMany({ _id: { $in: userIds } });

        res.json({ message: "Users deleted successfully." });
    } catch (error) {
        console.error("Error deleting users:", error);
        res.status(500).json({ message: "Failed to delete users." });
    }
}

const bulkUpdateRole = async (req, res) => {
    const { userIds, newRole } = req.body;

    if (!userIds || !newRole) {
        return res.status(400).json({ error: "User IDs and new role are required." });
    }

    try {
        await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { role: newRole } }
        );

        res.json({ message: "User roles updated successfully!" });
    } catch (error) {
        console.error("Error updating user roles:", error);
        res.status(500).json({ error: "Failed to update user roles." });
    }
}

const bulkUpdateStatus = async (req, res) => {
    const { userIds, newStatus } = req.body;

    if (!userIds || !newStatus) {
        return res.status(400).json({ error: "User IDs and new status are required." });
    }

    try {
        await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { status: newStatus } }
        );

        res.json({ message: "User statuses updated successfully!" });
    } catch (error) {
        console.error("Error updating user status:", error);
        res.status(500).json({ error: "Failed to update user status." });
    }
}

const getActiveUsersCount = async (req, res) => {
    try {
        const activeUsersCount = await User.countDocuments({ status: 'active' });

        res.status(200).json({ activeUsersCount });
    } catch (error) {
        console.error('Error fetching active users count:', error);
        res.status(500).json({ message: 'Failed to fetch active users count.' });
    }
}

const getNewUsers = async (req, res) => {
    try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const newUsers = await User.find({ createdAt: { $gte: sevenDaysAgo } })
            .sort({ createdAt: -1 });

        res.status(200).json(newUsers);
    } catch (error) {
        console.error("Error fetching new users:", error);
        res.status(500).json({ message: "Failed to fetch new users." });
    }
}

const getRecentActions = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Get user's recent favorites
        const recentFavs = await Favorite.find({ user: userId })
            .sort({ _id: -1 })
            .limit(6)
            .populate('favoriteId');

        // Get user's recent orders
        const recentOrders = await Order.find({ user: userId })
            .sort({ createdAt: -1 })
            .limit(3)
            .populate({
                path: 'groupedProducts.products',
                select: 'priceAtOrderTime quantity',
                populate: {
                    path: 'productSupplier',
                    populate: {
                        path: 'product',
                        select: 'name imageUrl productId'
                    },
                }
            })
            .populate({
                path: 'groupedProducts.supplier',
                select: 'name'
            });

        res.json({ recentFavs, recentOrders });
    } catch (err) {
        res.status(500).json({ error: 'Server error' });
    }
}

module.exports = {
    getUsers,
    addUser,
    editUser,
    getUserById,
    updateUser,
    deleteUser,
    getAddress,
    addAddress,
    updateAddress,
    makePrimary,
    deleteAddress,
    getNumber,
    addNumber,
    updateNumber,
    deleteNumber,
    uploadProfilePicture,
    changePassword,
    getActiveSessions,
    logoutSession,
    logoutFromOtherDevices,
    logoutAll,
    exportUsers,
    bulkDelete,
    bulkUpdateRole,
    bulkUpdateStatus,
    getActiveUsersCount,
    getNewUsers,
    getRecentActions
}