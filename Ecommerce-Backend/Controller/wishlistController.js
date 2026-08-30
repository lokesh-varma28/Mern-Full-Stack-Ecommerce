var User = require("../Model/UserModel")
var Product = require("../Model/ProductModel")
var mongoose = require("mongoose")

var getWishlist = async (req, res) => {
    try {
        var userId = req.user.userId
        var user = await User.findById(userId).select("wishlist")
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        var wishlistIds = normalizeWishlistIds(user.wishlist).filter(function (id) {
            return mongoose.Types.ObjectId.isValid(id)
        })
        var products = await Product.find({ _id: { $in: wishlistIds } })

        return res.status(200).json({
            wishlist: products
        })
    } catch (error) {
        console.error("getWishlist error:", error)
        return res.status(500).json({ message: "failed to fetch wishlist", error: error.message })
    }
}

function normalizeWishlistIds(wishlist) {
    if (!Array.isArray(wishlist)) return []
    return wishlist.map(function (id) {
        return String(id)
    })
}

var addToWishlist = async (req, res) => {
    try {
        var userId = req.user.userId
        var body = req.body || {}
        var productId = body.productId || body.product_id

        if (!productId) {
            return res.status(400).json({
                message: "productId is required",
                example: { productId: "PRODUCT_ID_HERE" }
            })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "invalid productId" })
        }

        var exists = await Product.findById(productId).select("_id")
        if (!exists) {
            return res.status(404).json({ message: "product not found" })
        }

        var user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        var ids = normalizeWishlistIds(user.wishlist)
        var pid = String(productId)
        if (!ids.some(function (id) {
            return id === pid
        })) {
            user.wishlist = ids.concat([pid])
            await user.save()
        }

        return res.status(200).json({ message: "added to wishlist", wishlist: user.wishlist })
    } catch (error) {
        console.error("addToWishlist error:", error)
        return res.status(500).json({ message: "failed to add to wishlist", error: error.message })
    }
}

var removeFromWishlist = async (req, res) => {
    try {
        var userId = req.user.userId
        var body = req.body || {}
        var productId = req.params.productId || body.productId || body.product_id || req.query.productId

        if (!productId) {
            return res.status(400).json({
                message: "productId is required",
                hint: "Use DELETE /wishlist/:productId or DELETE /wishlist with JSON/query { productId }"
            })
        }
        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({ message: "invalid productId" })
        }

        var user = await User.findById(userId)
        if (!user) {
            return res.status(404).json({ message: "user not found" })
        }

        var ids = normalizeWishlistIds(user.wishlist)
        var pid = String(productId)
        user.wishlist = ids.filter(function (id) {
            return id !== pid
        })
        await user.save()

        return res.status(200).json({ message: "removed from wishlist", wishlist: user.wishlist })
    } catch (error) {
        console.error("removeFromWishlist error:", error)
        return res.status(500).json({ message: "failed to remove from wishlist", error: error.message })
    }
}

module.exports = {
    getWishlist,
    addToWishlist,
    removeFromWishlist
}
