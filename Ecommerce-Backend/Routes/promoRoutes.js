var express = require("express")
var router = express.Router()

var { applyCoupon } = require("../Controller/promoController")
var auth = require("../MiddleWare/authMiddleware")

router.post("/apply-coupon", auth, applyCoupon)

module.exports = router