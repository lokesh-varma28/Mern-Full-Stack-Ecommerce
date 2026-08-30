
const rateLimit =
require("express-rate-limit")

const RedisStore =
require("rate-limit-redis").default

const {

    redisClient

} = require("../config/redisClient")



const sendRedisCommand = async (...args) => {
    if (!redisClient || !redisClient.isOpen) {
        return;
    }
    try {
        return await redisClient.sendCommand(args);
    } catch (err) {
        console.error("Redis rate limiter warning (failing open):", err.message);
        return;
    }
};

const createLimiters = () => {
    // PRODUCT LIMITER
    const productLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 1000,
        message: "Too many product requests",
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
            sendCommand: sendRedisCommand
        })
    });

    // ADMIN LIMITER
    const adminLimiter = rateLimit({
        windowMs: 60 * 1000,
        max: 1000,
        message: "Too many admin requests",
        standardHeaders: true,
        legacyHeaders: false,
        store: new RedisStore({
            sendCommand: sendRedisCommand
        })
    });

    return {
        productLimiter,
        adminLimiter
    };
};




module.exports = {

    createLimiters
}