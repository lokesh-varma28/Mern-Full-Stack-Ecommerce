var express = require("express")
const { getProfile, updateProfile, uploadAvatar, uploadCover } = require("../Controller/profileController")
const authMiddleware = require("../MiddleWare/authMiddleware")
const uploadMemory = require("../MiddleWare/uploadMemory")

var router = express.Router()

const handleUpload = (field) => (req, res, next) => {
    uploadMemory.single(field)(req, res, (err) => {
        if (err) {
            return res.status(400).json({ message: err.message || "Image upload failed" });
        }
        next();
    });
};

router.get("/profile", authMiddleware, getProfile)

router.put("/update-profile", authMiddleware, updateProfile)

router.post("/profile/avatar", authMiddleware, handleUpload("avatar"), uploadAvatar)

router.post("/profile/cover", authMiddleware, handleUpload("coverImage"), uploadCover)

module.exports = router