const { redisClient } = require("../config/redisClient")

const blacklistToken = async (token) => {
    await redisClient.set(token, "blocked", { EX: 60 * 60 * 24 })
}

module.exports = blacklistToken
