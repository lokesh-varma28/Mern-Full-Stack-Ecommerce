var mongoose = require("mongoose")

var userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    // optional – Google OAuth users have no password
    password: {
        type: String,
        required: false,
        default: null
    },
    // Google OAuth
    googleId: {
        type: String,
        default: null
    },
    avatar: {
        type: String,
        default: null
    },
    authProvider: {
        type: String,
        enum: ["local", "google"],
        default: "local"
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user"
    },
    storeName: {
        type: String,
        trim: true
    },
    sellerStatus: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending"
    },
    phone: {
        type: String,
        trim: true
    },
    businessAddress: {
        type: String,
        trim: true
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String
    },
    otpExpires: {
        type: Date
    },
    resetOtp: {
        type: String
    },
    refreshToken: {
        type: String
    },
    otpAttempts: {
        type: Number,
        default: 0
    },
    otpLastSent: {
        type: Date
    },
    resetOtpExpires: {
        type: Date
    },
    resetOtpAttempts: {
        type: Number,
        default: 0
    },
    lockUntil: {
        type: Date
    },
    loginAttempts: {
        type: Number,
        default: 0
    },
    wishlist: [
        {
            type: String
        }
    ]
}, { timestamps: true })

module.exports = mongoose.models.User || mongoose.model("User", userSchema)
