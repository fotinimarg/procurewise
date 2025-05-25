const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
    },
    deviceType: {
        type: String,
        required: true,
    },
    deviceName: {
        type: String
    },
    ipAddress: {
        type: String
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: '7d',
    },
});

module.exports = mongoose.model('Session', sessionSchema);