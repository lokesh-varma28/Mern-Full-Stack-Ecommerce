const { redisClient } = require("./redis");

// Save registration data for 5 minutes
const savePendingUser = async (email, data) => {
    await redisClient.set(
        `register:${email}`,
        JSON.stringify(data),
        {
            EX: 300 // 5 minutes
        }
    );
};

// Get registration data
const getPendingUser = async (email) => {
    const data = await redisClient.get(`register:${email}`);

    if (!data) return null;

    return JSON.parse(data);
};

// Delete registration data
const deletePendingUser = async (email) => {
    await redisClient.del(`register:${email}`);
};

module.exports = {
    savePendingUser,
    getPendingUser,
    deletePendingUser
};