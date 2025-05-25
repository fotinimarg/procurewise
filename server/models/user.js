const mongoose = require('mongoose');
const passportLocalMongoose = require('passport-local-mongoose');
const Schema = mongoose.Schema

const userSchema = new Schema({
    firstName: {
        type: String,
        required: true
    },
    lastName: {
        type: String,
        required: true
    },
    fullName: {
        type: String
    },
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String
    },
    businessName: {
        type: String
    },
    vatNumber: {
        type: String
    },
    address: [
        {
            _id: { type: Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
            street: String,
            city: String,
            postalCode: String,
            region: String,
            isPrimary: {
                type: Boolean,
                default: false
            }
        }
    ],
    phoneNumber: [
        {
            number: { type: String, required: true }
        }
    ],
    profilePicture: {
        type: String,
        default: '/default-avatar.png'
    },
    role: {
        type: String,
        enum: ['user', 'admin', 'moderator'],
        required: true,
        default: 'user'
    },
    status: {
        type: String,
        enum: ['active', 'inactive', 'banned'],
        default: 'active'
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    verificationToken: {
        type: String
    },
    lastLogin: {
        type: Date
    },
    resetToken: {
        type: String
    },
    resetTokenExpires: {
        type: Date
    }
}, { timestamps: true });

userSchema.plugin(passportLocalMongoose);

const UserModel = mongoose.model('User', userSchema);
module.exports = UserModel;