const mongoose = require("mongoose");
const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const { redisClient } = require("../config/redisClient");

// =========================================================================
// PUBLIC CUSTOMER API: GET PUBLIC SELLER STORE INFO
// GET /sellers/:sellerId
// =========================================================================
const getPublicSeller = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: "Seller storefront not found" });
    }

    const sellerUser = await User.findById(sellerId);

    // Only approved seller accounts have a public storefront
    if (!sellerUser || sellerUser.role !== "seller" || sellerUser.sellerStatus !== "approved") {
      return res.status(404).json({ success: false, message: "Seller storefront not found" });
    }

    // Count public active products belonging to this seller
    const productCount = await Product.countDocuments({
      seller: sellerId,
      isActive: { $ne: false },
    });

    // Return ONLY safe public seller information (never return password, email, phone, address, etc.)
    return res.status(200).json({
      success: true,
      seller: {
        _id: sellerUser._id,
        storeName: sellerUser.storeName || sellerUser.name || "Seller Store",
        sellerStatus: sellerUser.sellerStatus,
        productCount,
      },
    });
  } catch (error) {
    console.error("Error fetching public seller profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller storefront information",
      error: error.message,
    });
  }
};

// =========================================================================
// PUBLIC CUSTOMER API: GET PUBLIC SELLER PRODUCTS
// GET /sellers/:sellerId/products
// =========================================================================
const getPublicSellerProducts = async (req, res) => {
  try {
    const { sellerId } = req.params;

    if (!sellerId || !mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(404).json({ success: false, message: "Seller storefront not found" });
    }

    const sellerUser = await User.findById(sellerId);

    if (!sellerUser || sellerUser.role !== "seller" || sellerUser.sellerStatus !== "approved") {
      return res.status(404).json({ success: false, message: "Seller storefront not found" });
    }

    let page = parseInt(req.query.page, 10);
    if (isNaN(page) || page < 1) page = 1;

    let limit = parseInt(req.query.limit, 10);
    if (isNaN(limit) || limit < 1) limit = 20;
    if (limit > 100) limit = 100; // Cap maximum limit at 100 to prevent DoS/memory abuse

    const skip = (page - 1) * limit;

    // Isolated Redis cache key for seller products
    const cacheKey = `sellerproducts:${sellerId}:${page}:${limit}`;

    if (redisClient && redisClient.isOpen) {
      try {
        const cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          return res.status(200).json(JSON.parse(cachedData));
        }
      } catch (cacheErr) {
        console.error("Redis read error for public seller products:", cacheErr);
      }
    }

    const filter = {
      seller: sellerId,
      isActive: { $ne: false },
    };

    const totalProducts = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const response = {
      success: true,
      total: totalProducts,
      page,
      limit,
      totalPages: Math.ceil(totalProducts / limit),
      products,
    };

    if (redisClient && redisClient.isOpen) {
      try {
        await redisClient.setEx(cacheKey, 3600, JSON.stringify(response));
      } catch (cacheErr) {
        console.error("Redis write error for public seller products:", cacheErr);
      }
    }

    return res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching public seller products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller products",
      error: error.message,
    });
  }
};

module.exports = {
  getPublicSeller,
  getPublicSellerProducts,
};
