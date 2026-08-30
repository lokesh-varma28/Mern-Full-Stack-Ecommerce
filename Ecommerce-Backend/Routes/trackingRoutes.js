const express = require("express")
const router = express.Router()
const auth = require("../MiddleWare/authMiddleware")

const { trackOrder } = require("../Controller/trackingController")

router.get("/track/:id", auth, trackOrder)

module.exports = router