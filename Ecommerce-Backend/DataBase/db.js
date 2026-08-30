var mongoose = require("mongoose")

async function connectToDatabase() {
    try {
        await mongoose.connect(process.env.MONGO_URL)
        console.log("Database connected")
    } catch (error) {
        console.log("error", error)
    }
}

module.exports = connectToDatabase
