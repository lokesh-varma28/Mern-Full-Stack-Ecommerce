const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
require("dotenv").config();

const mongoose = require("mongoose");
const connectToDatabase = require("../DataBase/db.js");
const User = require("../Model/UserModel.js");
const Product = require("../Model/ProductModel.js");

async function migrateProductSellers() {
  try {
    // 1. Connect to Database
    await connectToDatabase();

    // 2 & 3. Find existing admin user(s)
    const adminUsers = await User.find({ role: "admin" });

    // 4. If no admin user exists
    if (!adminUsers || adminUsers.length === 0) {
      console.error("Error: No admin user found with role 'admin'.");
      console.error("Aborting migration. No products were modified.");
      await mongoose.disconnect();
      process.exit(1);
    }

    // 5. If multiple admin users exist
    if (adminUsers.length > 1) {
      const adminIds = adminUsers.map((u) => u._id.toString()).join(", ");
      console.error(`Error: Multiple admin users found with IDs: [${adminIds}].`);
      console.error("Cannot automatically select one admin. Aborting migration for explicit selection.");
      await mongoose.disconnect();
      process.exit(1);
    }

    const adminUser = adminUsers[0];

    // 6. Find products where seller does not exist or is null
    const missingSellerQuery = {
      $or: [{ seller: { $exists: false } }, { seller: null }],
    };

    const productsToMigrateCount = await Product.countDocuments(missingSellerQuery);

    // 7. Print preliminary status
    console.log(`Admin user selected: ${adminUser._id}`);
    console.log(`Products requiring migration: ${productsToMigrateCount}`);

    if (productsToMigrateCount === 0) {
      console.log("Migration completed");
      console.log(`Admin seller ID: ${adminUser._id}`);
      console.log(`Products updated: 0`);
      console.log(`Products remaining without seller: 0`);
      await mongoose.disconnect();
      return;
    }

    // 8 & 9. Update ONLY products whose seller is missing/null (NEVER overwrite existing seller)
    const result = await Product.updateMany(missingSellerQuery, {
      $set: { seller: adminUser._id },
    });

    const productsUpdated = result.modifiedCount;

    // 10. After migration, verify remaining count
    const remainingCount = await Product.countDocuments(missingSellerQuery);

    // 11. Print final summary
    console.log("Migration completed");
    console.log(`Admin seller ID: ${adminUser._id}`);
    console.log(`Products updated: ${productsUpdated}`);
    console.log(`Products remaining without seller: ${remainingCount}`);

    await mongoose.disconnect();
  } catch (error) {
    console.error("Migration failed with error:", error);
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    process.exit(1);
  }
}

if (require.main === module) {
  migrateProductSellers();
}

module.exports = migrateProductSellers;
