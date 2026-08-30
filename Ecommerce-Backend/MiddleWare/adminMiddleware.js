

const User = require("../Model/UserModel");

const adminMiddleware = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userId = req.user.userId || req.user._id || req.user.id;
    if (!userId) {
      return res.status(401).json({ message: "Invalid token user identity" });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(403).json({ message: "Admin user account not found" });
    }

    if (user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admin role required." });
    }

    req.adminUser = user;
    next();
  } catch (error) {
    console.error("Admin middleware error:", error);
    return res.status(500).json({ message: "Admin authorization error", error: error.message });
  }
};

module.exports = adminMiddleware;