var express = require("express")
var router = express.Router()

var { addTracking } = require("../Controller/shippingController")
var auth = require("../MiddleWare/authMiddleware")

router.post("/shipping", auth, addTracking)

module.exports = router