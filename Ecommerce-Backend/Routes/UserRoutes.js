
var express = require("express")
var router = express.Router()

const validate = require("../MiddleWare/validateMiddleware")
const {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema
} = require("../validation/authValidation")

const {
    registerUser,
    verifyOtp,
    resendOtp,
    login,
    forgotPassword,
    resetPassword,
    refreshTokenController
} = require("../Controller/UserController")
const authLimiter = require("../MiddleWare/authLimiter")

// REGISTER
router.post("/register",authLimiter ,validate(registerSchema), registerUser)

// LOGIN
router.post("/login", authLimiter, validate(loginSchema), login)

// VERIFY OTP
router.post("/verify-otp", authLimiter, validate(verifyOtpSchema), verifyOtp)

// RESEND OTP
router.post("/resend-otp", authLimiter,validate(resendOtpSchema), resendOtp)

// FORGOT PASSWORD
router.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), forgotPassword)

// RESET PASSWORD
router.post("/reset-password", authLimiter, validate(resetPasswordSchema), resetPassword)

// REFRESH TOKEN
router.post("/refresh-token", refreshTokenController)

module.exports = router