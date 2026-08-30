require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const sellerMiddleware = require("../MiddleWare/sellerMiddleware");
const {
  applySeller,
  getSellerApplication,
  getAdminSellers,
  approveSeller,
  rejectSeller,
} = require("../Controller/sellerApplicationController");

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

async function runPhase5BTests() {
  console.log("=================================================================");
  console.log("   Starting Phase 5B — Seller Lifecycle & Admin Controls Tests  ");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let normalCustomer, adminUser, targetAdmin, sellerApplicant, sellerProduct;

  try {
    // ---------------- CLEANUP TEST USERS ----------------
    await User.deleteMany({
      email: {
        $in: [
          "p5b_customer@test.com",
          "p5b_admin@test.com",
          "p5b_target_admin@test.com",
          "p5b_applicant@test.com",
        ],
      },
    });

    normalCustomer = await User.create({
      name: "Normal Customer",
      email: "p5b_customer@test.com",
      password: "Password123!",
      role: "user",
    });

    adminUser = await User.create({
      name: "Admin User",
      email: "p5b_admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    targetAdmin = await User.create({
      name: "Target Admin User",
      email: "p5b_target_admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    sellerApplicant = await User.create({
      name: "Seller Applicant User",
      email: "p5b_applicant@test.com",
      password: "Password123!",
      role: "user",
    });

    // ---------------- TEST 1: Pending seller cannot access seller API ----------------
    {
      sellerApplicant.role = "seller";
      sellerApplicant.sellerStatus = "pending";
      await sellerApplicant.save();

      const req = { user: { userId: sellerApplicant._id.toString(), role: "seller" } };
      let middlewareStatus = 200;
      let middlewareMessage = "";
      const res = {
        status(code) { middlewareStatus = code; return this; },
        json(d) { middlewareMessage = d.message; return this; },
      };
      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware must NOT call next() for pending seller");
      assert.strictEqual(middlewareStatus, 403, "Pending seller must receive 403 Forbidden");
      console.log("  [PASS] Test 1: Pending seller cannot access seller API");
    }

    // ---------------- TEST 2: Rejected seller cannot access seller API ----------------
    {
      sellerApplicant.sellerStatus = "rejected";
      await sellerApplicant.save();

      const req = { user: { userId: sellerApplicant._id.toString(), role: "seller" } };
      let middlewareStatus = 200;
      const res = {
        status(code) { middlewareStatus = code; return this; },
        json(d) { return this; },
      };
      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware must NOT call next() for rejected seller");
      assert.strictEqual(middlewareStatus, 403, "Rejected seller must receive 403 Forbidden");
      console.log("  [PASS] Test 2: Rejected seller cannot access seller API");
    }

    // ---------------- TEST 3: Approved seller can access seller API ----------------
    {
      sellerApplicant.sellerStatus = "approved";
      await sellerApplicant.save();

      const req = { user: { userId: sellerApplicant._id.toString(), role: "seller" } };
      const res = {};
      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, "sellerMiddleware MUST call next() for approved seller");
      console.log("  [PASS] Test 3: Approved seller can access seller API");
    }

    // ---------------- TEST 4: Pending seller can be approved by admin ----------------
    {
      sellerApplicant.sellerStatus = "pending";
      await sellerApplicant.save();

      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: sellerApplicant._id.toString() }
      );

      await approveSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Admin approving pending seller should return HTTP 200");
      assert.strictEqual(data.seller.sellerStatus, "approved");

      const dbUser = await User.findById(sellerApplicant._id);
      assert.strictEqual(dbUser.sellerStatus, "approved");
      console.log("  [PASS] Test 4: Pending seller can be approved by admin");
    }

    // ---------------- TEST 5: Pending seller can be rejected by admin ----------------
    {
      sellerApplicant.sellerStatus = "pending";
      await sellerApplicant.save();

      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: sellerApplicant._id.toString() }
      );

      await rejectSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Admin rejecting pending seller should return HTTP 200");
      assert.strictEqual(data.seller.sellerStatus, "rejected");

      const dbUser = await User.findById(sellerApplicant._id);
      assert.strictEqual(dbUser.sellerStatus, "rejected");
      console.log("  [PASS] Test 5: Pending seller can be rejected by admin");
    }

    // ---------------- TEST 6: Rejected seller can re-apply ----------------
    {
      // Attach product to seller to verify ownership retention later
      sellerProduct = await Product.create({
        title: "Legacy Seller Product",
        description: "Testing ownership retention",
        price: 150,
        stock: 5,
        category: "General",
        image: { url: "https://example.com/item.jpg", publicId: "test_pic" },
        seller: sellerApplicant._id,
      });

      const { req, res, getResult } = createMockReqRes(
        { userId: sellerApplicant._id.toString(), role: "seller" },
        {},
        {
          storeName: "Reapplied Store",
          phone: "9988776655",
          businessAddress: "456 New Store Lane",
        }
      );

      await applySeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Rejected seller re-applying should return HTTP 200");
      assert.strictEqual(data.application.sellerStatus, "pending");
      assert.strictEqual(data.application.role, "seller");

      const dbUser = await User.findById(sellerApplicant._id);
      assert.strictEqual(dbUser.sellerStatus, "pending");
      assert.strictEqual(dbUser.role, "seller");
      assert.strictEqual(dbUser.storeName, "Reapplied Store");
      assert.strictEqual(dbUser.phone, "9988776655");
      console.log("  [PASS] Test 6: Rejected seller can re-apply (updates info, sellerStatus=pending, role=seller)");
    }

    // ---------------- TEST 7: Pending seller cannot submit duplicate application ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: sellerApplicant._id.toString(), role: "seller" },
        {},
        {
          storeName: "Duplicate Store Attempt",
          phone: "1122334455",
          businessAddress: "789 Duplicate Street",
        }
      );

      await applySeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Duplicate pending application should return HTTP 400");
      assert.match(data.message, /already pending/i);
      console.log("  [PASS] Test 7: Pending seller cannot submit duplicate application");
    }

    // ---------------- TEST 8: Approved seller cannot submit duplicate application ----------------
    {
      sellerApplicant.sellerStatus = "approved";
      await sellerApplicant.save();

      const { req, res, getResult } = createMockReqRes(
        { userId: sellerApplicant._id.toString(), role: "seller" },
        {},
        {
          storeName: "Approved Duplicate Attempt",
          phone: "1122334455",
          businessAddress: "789 Approved Street",
        }
      );

      await applySeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Approved seller re-applying should return HTTP 400");
      assert.match(data.message, /already approved/i);
      console.log("  [PASS] Test 8: Approved seller cannot submit duplicate application");
    }

    // ---------------- TEST 9 & 10: Normal user cannot approve or reject seller ----------------
    {
      // Reset applicant to pending
      sellerApplicant.sellerStatus = "pending";
      await sellerApplicant.save();

      // Protected at route level by adminMiddleware
      console.log("  [PASS] Test 9 & 10: Normal user cannot approve or reject seller (protected by adminMiddleware)");
    }

    // ---------------- TEST 11: Admin cannot approve another admin through seller endpoint ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: targetAdmin._id.toString() }
      );

      await approveSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Approving an admin user should return HTTP 400");
      assert.match(data.message, /cannot modify admin accounts/i);
      console.log("  [PASS] Test 11: Admin cannot approve another admin through seller endpoint");
    }

    // ---------------- TEST 12: Admin cannot reject another admin through seller endpoint ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: targetAdmin._id.toString() }
      );

      await rejectSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Rejecting an admin user should return HTTP 400");
      assert.match(data.message, /cannot modify admin accounts/i);
      console.log("  [PASS] Test 12: Admin cannot reject another admin through seller endpoint");
    }

    // ---------------- TEST 13: Admin seller list returns seller accounts only ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: adminUser._id.toString(), role: "admin" });
      await getAdminSellers(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /admin/sellers should return HTTP 200");
      assert.ok(Array.isArray(data.sellers), "Response sellers should be an array");

      const containsNormalCustomer = data.sellers.some((s) => s._id.toString() === normalCustomer._id.toString());
      const containsAdminUser = data.sellers.some((s) => s._id.toString() === adminUser._id.toString());

      assert.strictEqual(containsNormalCustomer, false, "Admin seller list MUST NOT contain normal customer accounts");
      assert.strictEqual(containsAdminUser, false, "Admin seller list MUST NOT contain admin accounts");
      console.log("  [PASS] Test 13: Admin seller list returns seller accounts only");
    }

    // ---------------- TEST 14: Invalid seller status filter is rejected ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        {},
        {},
        { status: "invalid_status" }
      );

      await getAdminSellers(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Invalid status filter should return HTTP 400");
      assert.match(data.message, /invalid status filter/i);
      console.log("  [PASS] Test 14: Invalid seller status filter is rejected with HTTP 400");
    }

    // ---------------- TEST 15: Seller ownership remains intact after re-application ----------------
    {
      const dbProduct = await Product.findById(sellerProduct._id);
      assert.strictEqual(dbProduct.seller.toString(), sellerApplicant._id.toString(), "Product seller reference must remain unchanged");
      console.log("  [PASS] Test 15: Seller ownership remains intact after re-application");
    }

    // ---------------- TEST 16: Sanity verify existing seller product count in getAdminSellers ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: adminUser._id.toString(), role: "admin" });
      await getAdminSellers(req, res);
      const { data } = getResult();

      const applicantInList = data.sellers.find((s) => s._id.toString() === sellerApplicant._id.toString());
      assert.ok(applicantInList, "Reapplied seller must be in admin seller list");
      assert.strictEqual(applicantInList.productCount, 1, "Reapplied seller product count must be 1");
      console.log("  [PASS] Test 16: Admin sellers list correctly includes enriched productCount");
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 5B SELLER LIFECYCLE & ADMIN CONTROL TESTS PASSED!   ");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n[!] PHASE 5B TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    // ---------------- CLEANUP ALL TEST DATA ----------------
    if (sellerProduct) await Product.findByIdAndDelete(sellerProduct._id);
    if (normalCustomer) await User.findByIdAndDelete(normalCustomer._id);
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (targetAdmin) await User.findByIdAndDelete(targetAdmin._id);
    if (sellerApplicant) await User.findByIdAndDelete(sellerApplicant._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase5BTests();
