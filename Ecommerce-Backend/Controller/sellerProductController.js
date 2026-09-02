const Product = require("../Model/ProductModel");
const { uploadToCloudinary } = require("../helper/cloudinaryhelper");
const { redisClient } = require("../config/redisClient");

// Protected fields that sellers must never be allowed to overwrite
const PROTECTED_PRODUCT_FIELDS = [
  "_id",
  "id",
  "seller",
  "createdAt",
  "updatedAt",
  "reviews",
  "averageRating",
  "numReviews",
];

// Helper to invalidate public product cache and seller storefront cache
const clearProductCache = async (productId, sellerId) => {
  try {
    if (redisClient && redisClient.isOpen) {
      if (productId) {
        await redisClient.del(`product:${productId}`);
      }
      const allProductKeys = await redisClient.keys("allproducts:*");
      if (allProductKeys && allProductKeys.length > 0) {
        await redisClient.del(allProductKeys);
      }
      if (sellerId) {
        const sellerProductKeys = await redisClient.keys(`sellerproducts:${sellerId}:*`);
        if (sellerProductKeys && sellerProductKeys.length > 0) {
          await redisClient.del(sellerProductKeys);
        }
      }
    }
  } catch (err) {
    console.error("Redis cache clear error:", err.message);
  }
};

// Helper to determine active seller ID safely
const getSellerIdFromReq = (req) => {
  const tokenUserId = req.user?.userId || req.user?._id || req.user?.id;
  if (req.user?.role === "admin") {
    const explicitSellerId = req.query?.sellerId || req.body?.sellerId || req.params?.sellerId;
    return explicitSellerId || tokenUserId;
  }
  return tokenUserId;
};

// Helper to validate product fields server-side
const validateProductInputs = (body, isUpdate = false) => {
  // Check for protected field overwrite attempts
  for (const field of PROTECTED_PRODUCT_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      return `Overwriting protected field '${field}' is not permitted`;
    }
  }

  // Validate Title
  if (!isUpdate && (!body.title || typeof body.title !== "string" || !body.title.trim())) {
    return "Product title is required";
  }
  if (body.title !== undefined && (typeof body.title !== "string" || !body.title.trim())) {
    return "Product title cannot be empty";
  }

  // Validate Description
  if (!isUpdate && (!body.description || typeof body.description !== "string" || !body.description.trim())) {
    return "Product description is required";
  }
  if (body.description !== undefined && (typeof body.description !== "string" || !body.description.trim())) {
    return "Product description cannot be empty";
  }

  // Validate Price
  if (!isUpdate && (body.price === undefined || body.price === null || body.price === "")) {
    return "Product price is required";
  }
  if (body.price !== undefined) {
    const numPrice = Number(body.price);
    if (isNaN(numPrice) || numPrice < 0) {
      return "Price must be a valid non-negative number";
    }
  }

  // Validate Stock
  if (body.stock !== undefined && body.stock !== null && body.stock !== "") {
    const numStock = Number(body.stock);
    if (isNaN(numStock) || numStock < 0 || !Number.isInteger(numStock)) {
      return "Stock must be a valid non-negative integer";
    }
  }

  // Validate Discount
  if (body.discount !== undefined && body.discount !== null && body.discount !== "") {
    const numDiscount = Number(body.discount);
    if (isNaN(numDiscount) || numDiscount < 0 || numDiscount > 100) {
      return "Discount must be a valid number between 0 and 100";
    }
  }

  return null;
};

// ================= CREATE SELLER PRODUCT =================
// POST /seller/products
const createSellerProduct = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);

    // Validate inputs
    const validationError = validateProductInputs(req.body, false);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    const {
      title,
      description,
      price,
      stock,
      category,
      brand,
      discount,
      featured,
      isActive,
    } = req.body;

    let imageObj = null;

    if (req.file) {
      const { url, publicId } = await uploadToCloudinary(req.file.path);
      imageObj = { url, publicId };
    } else if (req.body.image && typeof req.body.image === "object") {
      imageObj = req.body.image;
    } else if (req.body.imageUrl && req.body.publicId) {
      imageObj = { url: req.body.imageUrl, publicId: req.body.publicId };
    }

    if (!imageObj || !imageObj.url || !imageObj.publicId) {
      return res.status(400).json({ success: false, message: "Product image is required" });
    }

    const productData = {
      title: title.trim(),
      description: description.trim(),
      price: Number(price),
      stock: stock !== undefined ? Number(stock) : 0,
      category: category ? category.trim() : "General",
      brand: brand ? brand.trim() : "No Brand",
      discount: discount !== undefined ? Number(discount) : 0,
      featured: featured === true || featured === "true",
      isActive: isActive !== false && isActive !== "false",
      image: imageObj,
      seller: sellerId, // ALWAYS set from authenticated user token or admin selection
    };

    const product = await Product.create(productData);

    // Invalidate public catalog & seller storefront cache
    await clearProductCache(product._id, sellerId);

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      product,
    });
  } catch (error) {
    console.error("Error creating seller product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to create product",
      error: error.message,
    });
  }
};

// ================= GET SELLER PRODUCTS =================
// GET /seller/products
const getSellerProducts = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);

    // Return ONLY products owned by the authenticated seller
    const products = await Product.find({ seller: sellerId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller products",
      error: error.message,
    });
  }
};

// ================= UPDATE SELLER PRODUCT =================
// PUT /seller/products/:id
const updateSellerProduct = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);
    const productId = req.params.id;

    // Validate inputs
    const validationError = validateProductInputs(req.body, true);
    if (validationError) {
      return res.status(400).json({ success: false, message: validationError });
    }

    // MUST enforce ownership server-side
    const product = await Product.findOne({ _id: productId, seller: sellerId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    const {
      title,
      description,
      price,
      stock,
      category,
      brand,
      discount,
      featured,
      isActive,
    } = req.body;

    if (title !== undefined) product.title = title.trim();
    if (description !== undefined) product.description = description.trim();
    if (price !== undefined) product.price = Number(price);
    if (stock !== undefined) product.stock = Number(stock);
    if (category !== undefined) product.category = category.trim();
    if (brand !== undefined) product.brand = brand.trim();
    if (discount !== undefined) product.discount = Number(discount);
    if (featured !== undefined) product.featured = featured === true || featured === "true";
    if (isActive !== undefined) product.isActive = isActive === true || isActive === "true";

    if (req.file) {
      const { url, publicId } = await uploadToCloudinary(req.file.path);
      product.image = { url, publicId };
    } else if (req.body.image && typeof req.body.image === "object") {
      product.image = req.body.image;
    }

    await product.save();

    // Invalidate public catalog & seller storefront cache
    await clearProductCache(product._id, sellerId);

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      product,
    });
  } catch (error) {
    console.error("Error updating seller product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

// ================= DELETE SELLER PRODUCT =================
// DELETE /seller/products/:id
const deleteSellerProduct = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);
    const productId = req.params.id;

    // MUST enforce ownership server-side
    const product = await Product.findOne({ _id: productId, seller: sellerId });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or access denied",
      });
    }

    await Product.findByIdAndDelete(product._id);

    // Invalidate public catalog & seller storefront cache
    await clearProductCache(product._id, sellerId);

    return res.status(200).json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting seller product:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

const mongoose = require("mongoose");

// ================= GET SELLER PRODUCT BY ID =================
// GET /seller/products/:id
const getSellerProductById = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);
    const productId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product ID format",
      });
    }

    // Enforce ownership server-side
    const product = await Product.findOne({ _id: productId, seller: sellerId });

    if (!product) {
      // Check if product exists under another seller to distinguish 403 from 404
      const existingProduct = await Product.findById(productId);
      if (existingProduct) {
        return res.status(403).json({
          success: false,
          message: "Access denied. You do not own this product.",
        });
      }
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    return res.status(200).json({
      success: true,
      product,
    });
  } catch (error) {
    console.error("Error fetching seller product by ID:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch product details",
      error: error.message,
    });
  }
};


module.exports = {
  createSellerProduct,
  getSellerProducts,
  getSellerProductById,
  updateSellerProduct,
  deleteSellerProduct,
};

