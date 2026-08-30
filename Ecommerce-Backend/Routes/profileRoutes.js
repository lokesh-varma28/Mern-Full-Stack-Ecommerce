var express = require("express")
const { getProfile, updateProfile } = require("../Controller/profileController")
const authMiddleware = require("../MiddleWare/authMiddleware")

var router = express.Router()


router.get("/profile", authMiddleware, getProfile)

router.put("/update-profile", authMiddleware, updateProfile)


module.exports = router 