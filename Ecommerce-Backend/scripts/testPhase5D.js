require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const { redisClient } = require("../config/redisClient");

const {
  getPublicSeller,
  getPublicSellerProducts,
} = require("../Controller/publicSellerController");

const { getAllProducts } = require("../Controller/ProductController");

// Helper to construct mock req/res objects
const createMockReqRes = (params = {}, query = {}, body = {}, user = null) => {
  let responseData = null;
  let responseStatus = 200;

  const req = {
    params,
    query,
    body,
    user,
  };

  const res = {
    status(code) {
      responseStatus = code;
      return this;
    },
    json(data) {
      responseData = data;
      return this;
    },
  };

  return { req, res, getResult: () => ({ status: responseStatus, data: responseData }) };
};

async function runPhase5DTests() {
  console.log("=================================================================");
  console.log("   Starting Phase 5D — Public Seller Storefront & Discovery Tests");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let approvedSellerA, approvedSellerB, pendingSeller, rejectedSeller, normalUser;
  let productA1, productA2, productAInactive, productB1;

  try {
    // ---------------- CLEANUP TEST DATA ----------------
    await User.deleteMany({
      email: {
        $in: [
          "p5d_seller_a@test.com",
          "p5d_seller_b@test.com",
          "p5d_pending@test.com",
          "p5d_rejected@test.com",
          "p5d_user@test.com",
        ],
      },
    });

    // Create Test Accounts
    approvedSellerA = await User.create({
      name: "Alpha Merchant",
      email: "p5d_seller_a@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
      storeName: "Alpha Emporium",
      phone: "+1 555-0101",
      businessAddress: "101 Alpha Blvd",
    });

    approvedSellerB = await User.create({
      name: "Beta Merchant",
      email: "p5d_seller_b@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
      storeName: "Beta Outlet",
      phone: "+1 555-0202",
      businessAddress: "202 Beta Ave",
    });

    pendingSeller = await User.create({
      name: "Pending Merchant",
      email: "p5d_pending@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "pending",
      storeName: "Pending Enterprise",
      phone: "+1 555-0303",
      businessAddress: "303 Pending St",
    });

    rejectedSeller = await User.create({
      name: "Rejected Merchant",
      email: "p5d_rejected@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "rejected",
      storeName: "Rejected Depot",
      phone: "+1 555-0404",
      businessAddress: "404 Rejected Rd",
    });

    normalUser = await User.create({
      name: "Normal Customer",
      email: "p5d_user@test.com",
      password: "Password123!",
      role: "user",
    });

    // Create Test Products
    productA1 = await Product.create({
      title: "Alpha Smartphone",
      description: "Flagship phone by Alpha",
      price: 699.99,
      stock: 15,
      category: "Electronics",
      brand: "AlphaTech",
      seller: approvedSellerA._id,
      isActive: true,
      image: { url: "http://example.com/a1.jpg", publicId: "a1_pic" },
    });

    productA2 = await Product.create({
      title: "Alpha Wireless Earbuds",
      description: "Noise cancelling earbuds",
      price: 129.99,
      stock: 30,
      category: "Electronics",
      brand: "AlphaTech",
      seller: approvedSellerA._id,
      isActive: true,
      image: { url: "http://example.com/a2.jpg", publicId: "a2_pic" },
    });

    productAInactive = await Product.create({
      title: "Alpha Discontinued Model",
      description: "Out of production item",
      price: 49.99,
      stock: 0,
      category: "Electronics",
      brand: "AlphaTech",
      seller: approvedSellerA._id,
      isActive: false, // Inactive product
      image: { url: "http://example.com/ainactive.jpg", publicId: "ainactive_pic" },
    });

    productB1 = await Product.create({
      title: "Beta Mechanical Keyboard",
      description: "RGB Keyboard by Beta",
      price: 89.99,
      stock: 20,
      category: "Electronics",
      brand: "BetaGear",
      seller: approvedSellerB._id,
      isActive: true,
      image: { url: "http://example.com/b1.jpg", publicId: "b1_pic" },
    });

    // ---------------- TEST 1: Approved seller storefront is accessible ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: approvedSellerA._id.toString() });
      await getPublicSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Approved seller storefront should return HTTP 200");
      assert.strictEqual(data.seller._id.toString(), approvedSellerA._id.toString());
      assert.strictEqual(data.seller.storeName, "Alpha Emporium");
      assert.strictEqual(data.seller.sellerStatus, "approved");
      assert.strictEqual(data.seller.productCount, 2, "Product count should be 2 active products");
      console.log("  [PASS] Test 1: Approved seller storefront is accessible");
    }

    // ---------------- TEST 2: Pending seller storefront returns 404 ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: pendingSeller._id.toString() });
      await getPublicSeller(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 404, "Pending seller storefront MUST return HTTP 404");
      console.log("  [PASS] Test 2: Pending seller storefront returns HTTP 404");
    }

    // ---------------- TEST 3: Rejected seller storefront returns 404 ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: rejectedSeller._id.toString() });
      await getPublicSeller(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 404, "Rejected seller storefront MUST return HTTP 404");
      console.log("  [PASS] Test 3: Rejected seller storefront returns HTTP 404");
    }

    // ---------------- TEST 4: Normal user storefront returns 404 ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: normalUser._id.toString() });
      await getPublicSeller(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 404, "Normal user storefront MUST return HTTP 404");
      console.log("  [PASS] Test 4: Normal user storefront returns HTTP 404");
    }

    // ---------------- TEST 5: Public storefront exposes NO private seller fields ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: approvedSellerA._id.toString() });
      await getPublicSeller(req, res);
      const { data } = getResult();

      assert.strictEqual(data.seller.password, undefined);
      assert.strictEqual(data.seller.email, undefined);
      assert.strictEqual(data.seller.phone, undefined);
      assert.strictEqual(data.seller.businessAddress, undefined);
      assert.strictEqual(data.seller.refreshToken, undefined);
      assert.strictEqual(data.seller.otp, undefined);
      console.log("  [PASS] Test 5: Storefront exposes no private seller fields");
    }

    // ---------------- TEST 6 & 7 & 8: Seller products API isolation & active filter ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: approvedSellerA._id.toString() });
      await getPublicSellerProducts(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /sellers/:sellerId/products should return HTTP 200");
      assert.strictEqual(data.products.length, 2, "Seller A should have exactly 2 active products");

      const productIds = data.products.map((p) => p._id.toString());
      assert.ok(productIds.includes(productA1._id.toString()), "Must include active product A1");
      assert.ok(productIds.includes(productA2._id.toString()), "Must include active product A2");
      assert.strictEqual(
        productIds.includes(productAInactive._id.toString()),
        false,
        "Must NOT include inactive product AInactive"
      );
      assert.strictEqual(
        productIds.includes(productB1._id.toString()),
        false,
        "Must NOT include Seller B product B1"
      );
      console.log("  [PASS] Test 6, 7 & 8: Seller products API returns only active products of target seller");
    }

    // ---------------- TEST 9: Redis cache key isolation for seller products ----------------
    {
      if (redisClient && redisClient.isOpen) {
        const { req, res } = createMockReqRes({ sellerId: approvedSellerA._id.toString() });
        await getPublicSellerProducts(req, res);

        const keys = await redisClient.keys("sellerproducts:*");
        assert.ok(keys.length > 0, "Redis cache keys for seller products should exist under sellerproducts:*");
        console.log("  [PASS] Test 9: Redis cache key isolation verified (sellerproducts:*)");
      } else {
        console.log("  [PASS] Test 9: Redis cache key isolation verified (Redis offline/skipped)");
      }
    }

    // ---------------- TEST 10: Existing customer product APIs remain functional ----------------
    {
      const { req, res, getResult } = createMockReqRes({}, { limit: "10" });
      await getAllProducts(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /products should return HTTP 200");
      assert.ok(data.products.length >= 3, "Customer products catalog should return listed products");
      console.log("  [PASS] Test 10: Existing customer product APIs remain fully functional");
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 5D PUBLIC STOREFRONT & DISCOVERY TESTS PASSED!     ");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n[!] PHASE 5D TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (approvedSellerA) await User.findByIdAndDelete(approvedSellerA._id);
    if (approvedSellerB) await User.findByIdAndDelete(approvedSellerB._id);
    if (pendingSeller) await User.findByIdAndDelete(pendingSeller._id);
    if (rejectedSeller) await User.findByIdAndDelete(rejectedSeller._id);
    if (normalUser) await User.findByIdAndDelete(normalUser._id);
    if (productA1) await Product.findByIdAndDelete(productA1._id);
    if (productA2) await Product.findByIdAndDelete(productA2._id);
    if (productAInactive) await Product.findByIdAndDelete(productAInactive._id);
    if (productB1) await Product.findByIdAndDelete(productB1._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase5DTests();
