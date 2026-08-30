require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");

const {
  getSellerProfile,
  updateSellerProfile,
} = require("../Controller/sellerProfileController");

const sellerMiddleware = require("../MiddleWare/sellerMiddleware");

// Helper to construct mock req/res objects
const createMockReqRes = (user, params = {}, body = {}, query = {}) => {
  let responseData = null;
  let responseStatus = 200;

  const req = {
    user,
    params,
    body,
    query,
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

async function runPhase5CTests() {
  console.log("=================================================================");
  console.log("   Starting Phase 5C — Seller Store/Profile Management Tests    ");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let approvedSellerA, approvedSellerB, pendingSeller, rejectedSeller, normalUser, testProduct, testOrder;

  try {
    // ---------------- CLEANUP TEST DATA ----------------
    await User.deleteMany({
      email: {
        $in: [
          "p5c_seller_a@test.com",
          "p5c_seller_b@test.com",
          "p5c_pending@test.com",
          "p5c_rejected@test.com",
          "p5c_user@test.com",
        ],
      },
    });

    // Create test accounts
    approvedSellerA = await User.create({
      name: "Seller Alpha",
      email: "p5c_seller_a@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
      storeName: "Alpha Store",
      phone: "1112223333",
      businessAddress: "100 Alpha St",
    });

    approvedSellerB = await User.create({
      name: "Seller Beta",
      email: "p5c_seller_b@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
      storeName: "Beta Store",
      phone: "4445556666",
      businessAddress: "200 Beta St",
    });

    pendingSeller = await User.create({
      name: "Pending Seller",
      email: "p5c_pending@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "pending",
      storeName: "Pending Store",
      phone: "7778889999",
      businessAddress: "300 Pending St",
    });

    rejectedSeller = await User.create({
      name: "Rejected Seller",
      email: "p5c_rejected@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "rejected",
      storeName: "Rejected Store",
      phone: "0001112222",
      businessAddress: "400 Rejected St",
    });

    normalUser = await User.create({
      name: "Normal Customer",
      email: "p5c_user@test.com",
      password: "Password123!",
      role: "user",
    });

    // ---------------- TEST 1: Approved seller can GET own profile ----------------
    {
      const { req, res, getResult } = createMockReqRes({
        userId: approvedSellerA._id.toString(),
        role: "seller",
      });

      await getSellerProfile(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /seller/profile should return HTTP 200");
      assert.strictEqual(data.seller._id.toString(), approvedSellerA._id.toString());
      assert.strictEqual(data.seller.name, "Seller Alpha");
      assert.strictEqual(data.seller.email, "p5c_seller_a@test.com");
      assert.strictEqual(data.seller.storeName, "Alpha Store");
      assert.strictEqual(data.seller.phone, "1112223333");
      assert.strictEqual(data.seller.businessAddress, "100 Alpha St");
      assert.strictEqual(data.seller.role, "seller");
      assert.strictEqual(data.seller.sellerStatus, "approved");

      // Verify no sensitive auth fields returned
      assert.strictEqual(data.seller.password, undefined);
      assert.strictEqual(data.seller.refreshToken, undefined);
      assert.strictEqual(data.seller.otp, undefined);

      console.log("  [PASS] Test 1: Approved seller can GET own profile (safe fields only)");
    }

    // ---------------- TEST 2: Approved seller can update own storeName ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { storeName: "Alpha Mega Store" }
      );

      await updateSellerProfile(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Updating storeName should return HTTP 200");
      assert.strictEqual(data.seller.storeName, "Alpha Mega Store");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.storeName, "Alpha Mega Store");
      console.log("  [PASS] Test 2: Approved seller can update own storeName");
    }

    // ---------------- TEST 3: Approved seller can update own phone ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { phone: "+1 555-0199" }
      );

      await updateSellerProfile(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Updating phone should return HTTP 200");
      assert.strictEqual(data.seller.phone, "+1 555-0199");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.phone, "+1 555-0199");
      console.log("  [PASS] Test 3: Approved seller can update own phone");
    }

    // ---------------- TEST 4: Approved seller can update own businessAddress ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { businessAddress: "999 Commerce Blvd, Suite 100" }
      );

      await updateSellerProfile(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Updating businessAddress should return HTTP 200");
      assert.strictEqual(data.seller.businessAddress, "999 Commerce Blvd, Suite 100");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.businessAddress, "999 Commerce Blvd, Suite 100");
      console.log("  [PASS] Test 4: Approved seller can update own businessAddress");
    }

    // ---------------- TEST 5: Seller cannot change role ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { role: "admin" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 400, "Attempting to change role MUST return HTTP 400");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.role, "seller", "Role in DB must remain unchanged");
      console.log("  [PASS] Test 5: Seller cannot change role (HTTP 400 rejected)");
    }

    // ---------------- TEST 6: Seller cannot change sellerStatus ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { sellerStatus: "rejected" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 400, "Attempting to change sellerStatus MUST return HTTP 400");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.sellerStatus, "approved", "sellerStatus in DB must remain unchanged");
      console.log("  [PASS] Test 6: Seller cannot change sellerStatus (HTTP 400 rejected)");
    }

    // ---------------- TEST 7: Seller cannot change email ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { email: "hacked@test.com" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 400, "Attempting to change email MUST return HTTP 400");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.email, "p5c_seller_a@test.com", "Email in DB must remain unchanged");
      console.log("  [PASS] Test 7: Seller cannot change email (HTTP 400 rejected)");
    }

    // ---------------- TEST 8: Seller cannot change password ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { password: "HackedPassword123!" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 400, "Attempting to change password MUST return HTTP 400");

      const dbUser = await User.findById(approvedSellerA._id);
      assert.strictEqual(dbUser.password, "Password123!", "Password in DB must remain unchanged");
      console.log("  [PASS] Test 8: Seller cannot change password (HTTP 400 rejected)");
    }

    // ---------------- TEST 9: Seller cannot update another seller using sellerId in body ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { sellerId: approvedSellerB._id.toString(), storeName: "Hijacked Beta Store" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 400, "Passing sellerId in body MUST return HTTP 400");

      const dbSellerB = await User.findById(approvedSellerB._id);
      assert.strictEqual(dbSellerB.storeName, "Beta Store", "Other seller's storeName must remain untouched");
      console.log("  [PASS] Test 9: Seller cannot update another seller using sellerId in body");
    }

    // ---------------- TEST 10: Pending seller cannot access profile API ----------------
    {
      const req = { user: { userId: pendingSeller._id.toString(), role: "seller" } };
      let middlewareStatus = 200;

      const res = {
        status(c) { middlewareStatus = c; return this; },
        json() { return this; },
      };

      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware MUST NOT call next() for pending seller");
      assert.strictEqual(middlewareStatus, 403, "Pending seller MUST be blocked with HTTP 403");
      console.log("  [PASS] Test 10: Pending seller cannot access profile API");
    }

    // ---------------- TEST 11: Rejected seller cannot access profile API ----------------
    {
      const req = { user: { userId: rejectedSeller._id.toString(), role: "seller" } };
      let middlewareStatus = 200;

      const res = {
        status(c) { middlewareStatus = c; return this; },
        json() { return this; },
      };

      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware MUST NOT call next() for rejected seller");
      assert.strictEqual(middlewareStatus, 403, "Rejected seller MUST be blocked with HTTP 403");
      console.log("  [PASS] Test 11: Rejected seller cannot access profile API");
    }

    // ---------------- TEST 12: Normal user cannot access profile API ----------------
    {
      const req = { user: { userId: normalUser._id.toString(), role: "user" } };
      let middlewareStatus = 200;

      const res = {
        status(c) { middlewareStatus = c; return this; },
        json() { return this; },
      };

      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware MUST NOT call next() for normal user");
      assert.strictEqual(middlewareStatus, 403, "Normal user MUST be blocked with HTTP 403");
      console.log("  [PASS] Test 12: Normal user cannot access profile API");
    }

    // ---------------- TEST 13: Profile update does not change Product.seller ownership ----------------
    {
      testProduct = await Product.create({
        title: "Test Product Alpha",
        price: 99.99,
        description: "Test description",
        category: "Electronics",
        brand: "TestBrand",
        seller: approvedSellerA._id,
        stock: 10,
        image: {
          url: "http://example.com/product.jpg",
          publicId: "test_public_id",
        },
      });

      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { storeName: "Updated Alpha Store 2" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();
      assert.strictEqual(status, 200);

      const dbProduct = await Product.findById(testProduct._id);
      assert.strictEqual(
        dbProduct.seller.toString(),
        approvedSellerA._id.toString(),
        "Product.seller ownership MUST remain unchanged"
      );
      console.log("  [PASS] Test 13: Profile update does not change Product.seller ownership");
    }

    // ---------------- TEST 14: Profile update does not change Order.items[].seller ownership ----------------
    {
      const testAddress = await Address.create({
        user: normalUser._id,
        fullName: "Normal Customer",
        mobile: "9876543210",
        pincode: "110001",
        house: "123 Test St",
        area: "Downtown",
        city: "Test City",
        state: "Test State",
        country: "Testland",
      });

      testOrder = await Order.create({
        userId: normalUser._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.title,
            quantity: 1,
            price: 99.99,
            seller: approvedSellerA._id,
            itemStatus: "pending",
          },
        ],
        totalAmount: 99.99,
        finalAmount: 99.99,
        shippingAddress: testAddress._id,
        paymentMethod: "COD",
      });

      const { req, res, getResult } = createMockReqRes(
        { userId: approvedSellerA._id.toString(), role: "seller" },
        {},
        { phone: "+1 555-9999" }
      );

      await updateSellerProfile(req, res);
      const { status } = getResult();
      assert.strictEqual(status, 200);

      const dbOrder = await Order.findById(testOrder._id);
      assert.strictEqual(
        dbOrder.items[0].seller.toString(),
        approvedSellerA._id.toString(),
        "Order.items[].seller ownership MUST remain unchanged"
      );
      console.log("  [PASS] Test 14: Profile update does not change Order.items[].seller ownership");

      await Address.findByIdAndDelete(testAddress._id);
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 5C SELLER PROFILE MANAGEMENT TESTS PASSED!         ");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n[!] PHASE 5C TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (approvedSellerA) await User.findByIdAndDelete(approvedSellerA._id);
    if (approvedSellerB) await User.findByIdAndDelete(approvedSellerB._id);
    if (pendingSeller) await User.findByIdAndDelete(pendingSeller._id);
    if (rejectedSeller) await User.findByIdAndDelete(rejectedSeller._id);
    if (normalUser) await User.findByIdAndDelete(normalUser._id);
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase5CTests();
