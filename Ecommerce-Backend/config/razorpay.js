require("dotenv").config();

var Razorpay = require("razorpay");

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error(
        "FATAL: RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is missing from environment variables."
    );
}

var instance = new Razorpay({
    key_id:     process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

module.exports = instance;
