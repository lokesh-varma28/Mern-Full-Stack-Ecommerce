const User = require("../Model/UserModel");

const sellerMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token user identity" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    if (req.user.role !== "seller") {
      return res.status(403).json({ message: "Access denied. Seller or Admin role required." });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ message: "Seller user account not found" });
    }

    if (user.sellerStatus !== "approved") {
      return res.status(403).json({ message: "Seller account approval is required" });
    }

    next();
  } catch (error) {
    console.error("Seller middleware error:", error);
    return res.status(500).json({ message: "Seller authorization error", error: error.message });
  }
};

module.exports = sellerMiddleware;
