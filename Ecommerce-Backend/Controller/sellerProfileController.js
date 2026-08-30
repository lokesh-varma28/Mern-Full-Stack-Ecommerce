const User = require("../Model/UserModel");

// Forbidden fields that sellers are not allowed to update
const FORBIDDEN_FIELDS = [
  "_id",
  "id",
  "name",
  "email",
  "role",
  "sellerStatus",
  "password",
  "refreshToken",
  "otp",
  "resetOtp",
  "otpExpires",
  "resetOtpExpires",
  "otpAttempts",
  "lockUntil",
  "loginAttempts",
  "googleId",
  "authProvider",
  "isVerified",
  "sellerId",
];

// =========================================================================
// SELLER: GET OWN PROFILE
// GET /seller/profile
// =========================================================================
const getSellerProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const user = await User.findById(userId).select(
      "_id name email storeName phone businessAddress role sellerStatus createdAt updatedAt"
    );

    if (!user) {
      return res.status(404).json({ success: false, message: "Seller account not found" });
    }

    return res.status(200).json({
      success: true,
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName || "",
        phone: user.phone || "",
        businessAddress: user.businessAddress || "",
        role: user.role,
        sellerStatus: user.sellerStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error fetching seller profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller profile",
      error: error.message,
    });
  }
};

// =========================================================================
// SELLER: UPDATE OWN PROFILE
// PUT /seller/profile
// =========================================================================
const updateSellerProfile = async (req, res) => {
  try {
    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    // Check for forbidden fields in request body
    for (const field of FORBIDDEN_FIELDS) {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        return res.status(400).json({
          success: false,
          message: `Modifying field '${field}' is not allowed via seller profile update`,
        });
      }
    }

    const { storeName, phone, businessAddress } = req.body;

    // Validate storeName if provided
    if (storeName !== undefined) {
      if (typeof storeName !== "string" || !storeName.trim()) {
        return res.status(400).json({
          success: false,
          message: "Store Name cannot be empty",
        });
      }
      if (storeName.trim().length > 100) {
        return res.status(400).json({
          success: false,
          message: "Store Name cannot exceed 100 characters",
        });
      }
    }

    // Validate phone if provided
    if (phone !== undefined) {
      if (typeof phone !== "string" || !phone.trim()) {
        return res.status(400).json({
          success: false,
          message: "Phone number cannot be empty",
        });
      }
      if (phone.trim().length > 25) {
        return res.status(400).json({
          success: false,
          message: "Phone number cannot exceed 25 characters",
        });
      }
    }

    // Validate businessAddress if provided
    if (businessAddress !== undefined) {
      if (typeof businessAddress !== "string" || !businessAddress.trim()) {
        return res.status(400).json({
          success: false,
          message: "Business Address cannot be empty",
        });
      }
      if (businessAddress.trim().length > 300) {
        return res.status(400).json({
          success: false,
          message: "Business Address cannot exceed 300 characters",
        });
      }
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "Seller account not found" });
    }

    // Apply valid profile updates
    if (storeName !== undefined) user.storeName = storeName.trim();
    if (phone !== undefined) user.phone = phone.trim();
    if (businessAddress !== undefined) user.businessAddress = businessAddress.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Seller profile updated successfully",
      seller: {
        _id: user._id,
        name: user.name,
        email: user.email,
        storeName: user.storeName,
        phone: user.phone,
        businessAddress: user.businessAddress,
        role: user.role,
        sellerStatus: user.sellerStatus,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error("Error updating seller profile:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update seller profile",
      error: error.message,
    });
  }
};

module.exports = {
  getSellerProfile,
  updateSellerProfile,
};
