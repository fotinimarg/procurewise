const cron = require('node-cron');
const mongoose = require('mongoose');
const Order = require('../models/order');
const User = require('../models/user');
const Session = require('../models/session');

// Cleanup task to run daily at midnight
cron.schedule('0 0 * * *', async () => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago

        // Delete carts with no products and older than 30 days
        const result = await Order.deleteMany({
            $and: [
                { groupedProducts: { $size: 0 } },
                { createdAt: { $lt: cutoffDate } },
            ],
            status: 'cart',
        });

        console.log(`Deleted ${result.deletedCount} empty carts.`);

        // Deactivate users who haven't logged in for 12 months
        const lastActiveCutoff = new Date();
        lastActiveCutoff.setFullYear(lastActiveCutoff.getFullYear() - 1);

        const inactiveUsers = await User.find({
            status: 'active',
            $or: [
                { lastLogin: { $exists: false } },
                { lastLogin: { $lt: lastActiveCutoff } },
            ]
        });

        for (const user of inactiveUsers) {
            await User.findByIdAndUpdate(user._id, { status: 'inactive' });
            console.log(`User ${user.email} has been set to inactive.`);
        }

        console.log('Inactive user cleanup completed.');
    } catch (error) {
        console.error('Error cleaning up empty carts:', error.message);
    }
})