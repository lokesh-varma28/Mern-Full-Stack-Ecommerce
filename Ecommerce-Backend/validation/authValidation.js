const Joi = require("joi")

const registerSchema = Joi.object({
    name: Joi.string().trim().min(2).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("user", "seller").optional(),
    storeName: Joi.string().trim().max(100).optional(),
    phone: Joi.string().trim().max(25).optional(),
    businessAddress: Joi.string().trim().max(300).optional(),
})

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
})

const verifyOtpSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required()
})

const resendOtpSchema = Joi.object({
    email: Joi.string().email().required()
})

const forgotPasswordSchema = Joi.object({
    email: Joi.string().email().required()
})

const resetPasswordSchema = Joi.object({
    email: Joi.string().email().required(),
    otp: Joi.string().length(6).required(),
    newPassword: Joi.string().min(6).required()
})

module.exports = {
    registerSchema,
    loginSchema,
    verifyOtpSchema,
    resendOtpSchema,
    forgotPasswordSchema,
    resetPasswordSchema
}
