const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");

// Helper function to escape special regex characters for safe MongoDB searches
function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}

// =========================================================================
// CUSTOMER: APPLY TO BECOME A SELLER
// POST /seller/apply
// =========================================================================
const applySeller = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const { storeName, phone, businessAddress } = req.body;

    if (!storeName || !storeName.trim()) {
      return res.status(400).json({ success: false, message: "Store Name is required" });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required" });
    }

    if (!businessAddress || !businessAddress.trim()) {
      return res.status(400).json({ success: false, message: "Business Address is required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    // Admin safety check
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Admin accounts cannot apply as sellers" });
    }

    // Approved seller check
    if (user.role === "seller" && user.sellerStatus === "approved") {
      return res.status(400).json({ success: false, message: "Your seller account is already approved" });
    }

    // Duplicate pending check
    if (user.role === "seller" && user.sellerStatus === "pending") {
      return res.status(400).json({
        success: false,
        message: "Your seller application is already pending admin review",
        application: {
          storeName: user.storeName,
          phone: user.phone,
          businessAddress: user.businessAddress,
          sellerStatus: user.sellerStatus,
        },
      });
    }

    // Application submission (new customer or rejected seller re-application)
    user.storeName = storeName.trim();
    user.phone = phone.trim();
    user.businessAddress = businessAddress.trim();
    user.role = "seller";
    user.sellerStatus = "pending";

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Seller application submitted successfully and is pending admin approval",
      application: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        phone: user.phone,
        businessAddress: user.businessAddress,
        role: user.role,
        sellerStatus: user.sellerStatus,
      },
    });
  } catch (error) {
    console.error("Error submitting seller application:", error);
    return res.status(500).json({ success: false, message: "Failed to submit seller application", error: error.message });
  }
};

// =========================================================================
// CUSTOMER: GET SELLER APPLICATION STATUS
// GET /seller/application
// =========================================================================
const getSellerApplication = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(userId).select("name email storeName phone businessAddress role sellerStatus createdAt updatedAt");
    if (!user) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    return res.status(200).json({
      success: true,
      application: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName || "",
        phone: user.phone || "",
        businessAddress: user.businessAddress || "",
        role: user.role,
        sellerStatus: user.role === "seller" ? user.sellerStatus : null,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching seller application:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch seller application", error: error.message });
  }
};

// =========================================================================
// ADMIN: LIST ALL SELLER ACCOUNTS / APPLICATIONS
// GET /admin/sellers?status=pending|approved|rejected&search=query
// =========================================================================
const getAdminSellers = async (req, res) => {
  try {
    const query = { role: "seller" };

    // Validate status filter
    if (req.query.status && req.query.status.trim()) {
      const statusParam = req.query.status.trim().toLowerCase();
      if (!["pending", "approved", "rejected"].includes(statusParam)) {
        return res.status(400).json({
          success: false,
          message: "Invalid status filter. Allowed values: pending, approved, rejected",
        });
      }
      query.sellerStatus = statusParam;
    }

    // Safe search filter
    if (req.query.search && req.query.search.trim()) {
      const searchRegex = new RegExp(escapeRegex(req.query.search.trim()), "i");
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { storeName: searchRegex },
      ];
    }

    const sellers = await User.find(query)
      .select("_id name email role sellerStatus storeName phone businessAddress createdAt updatedAt")
      .sort({ updatedAt: -1 })
      .lean();

    const sellerIds = sellers.map((s) => s._id);

    // Aggregate product and order counts for each seller
    const [productCounts, orderCounts] = await Promise.all([
      Product.aggregate([
        { $match: { seller: { $in: sellerIds } } },
        { $group: { _id: "$seller", count: { $sum: 1 } } },
      ]),
      Order.aggregate([
        { $unwind: "$items" },
        { $match: { "items.seller": { $in: sellerIds } } },
        { $group: { _id: "$items.seller", orderIds: { $addToSet: "$_id" } } },
        { $project: { _id: 1, count: { $size: "$orderIds" } } },
      ]),
    ]);

    const productCountMap = {};
    productCounts.forEach((p) => {
      if (p._id) productCountMap[p._id.toString()] = p.count;
    });

    const orderCountMap = {};
    orderCounts.forEach((o) => {
      if (o._id) orderCountMap[o._id.toString()] = o.count;
    });

    const enrichedSellers = sellers.map((s) => ({
      ...s,
      productCount: productCountMap[s._id.toString()] || 0,
      orderCount: orderCountMap[s._id.toString()] || 0,
    }));

    return res.status(200).json({
      success: true,
      count: enrichedSellers.length,
      sellers: enrichedSellers,
    });
  } catch (error) {
    console.error("Error fetching admin sellers:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch sellers list", error: error.message });
  }
};

// =========================================================================
// ADMIN: APPROVE SELLER APPLICATION
// PUT /admin/sellers/:id/approve
// =========================================================================
const approveSeller = async (req, res) => {
  try {
    const sellerUserId = req.params.id;

    const user = await User.findById(sellerUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Seller user account not found" });
    }

    // Admin safety guard
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot modify admin accounts using seller endpoints" });
    }

    // Target user must be a seller applicant
    if (user.role !== "seller") {
      return res.status(400).json({ success: false, message: "User has not applied to be a seller" });
    }

    if (user.sellerStatus === "approved") {
      return res.status(400).json({ success: false, message: "Seller application is already approved" });
    }

    user.role = "seller";
    user.sellerStatus = "approved";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Seller "${user.storeName || user.name}" approved successfully`,
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        role: user.role,
        sellerStatus: user.sellerStatus,
      },
    });
  } catch (error) {
    console.error("Error approving seller:", error);
    return res.status(500).json({ success: false, message: "Failed to approve seller", error: error.message });
  }
};

// =========================================================================
// ADMIN: REJECT SELLER APPLICATION
// PUT /admin/sellers/:id/reject
// =========================================================================
const rejectSeller = async (req, res) => {
  try {
    const sellerUserId = req.params.id;

    const user = await User.findById(sellerUserId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Seller user account not found" });
    }

    // Admin safety guard
    if (user.role === "admin") {
      return res.status(400).json({ success: false, message: "Cannot modify admin accounts using seller endpoints" });
    }

    // Target user must be a seller applicant
    if (user.role !== "seller") {
      return res.status(400).json({ success: false, message: "User has not applied to be a seller" });
    }

    if (user.sellerStatus === "rejected") {
      return res.status(400).json({ success: false, message: "Seller application is already rejected" });
    }

    user.role = "seller";
    user.sellerStatus = "rejected";
    await user.save();

    return res.status(200).json({
      success: true,
      message: `Seller "${user.storeName || user.name}" rejected`,
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        role: user.role,
        sellerStatus: user.sellerStatus,
      },
    });
  } catch (error) {
    console.error("Error rejecting seller:", error);
    return res.status(500).json({ success: false, message: "Failed to reject seller", error: error.message });
  }
};


module.exports = {
  applySeller,
  getSellerApplication,
  getAdminSellers,
  approveSeller,
  rejectSeller,
};

