var express = require("express")
const authMiddleware = require("../MiddleWare/authMiddleware")
const { getWishlist, addToWishlist, removeFromWishlist } = require("../Controller/wishlistController")

var router = express.Router()

router.get("/wishlist", authMiddleware, getWishlist)
router.post("/wishlist", authMiddleware, addToWishlist)
router.delete("/wishlist/:productId", authMiddleware, removeFromWishlist)
router.delete("/wishlist", authMiddleware, removeFromWishlist)

module.exports = router
