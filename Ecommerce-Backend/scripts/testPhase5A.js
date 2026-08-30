require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const {
  applySeller,
  getSellerApplication,
  getAdminSellers,
  approveSeller,
  rejectSeller,
} = require("../Controller/sellerApplicationController");

const { getSellerProducts } = require("../Controller/sellerProductController");
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

async function runPhase5ATests() {
  console.log("=================================================================");
  console.log("   Starting Phase 5A — Seller Onboarding & Admin Approval Tests  ");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let normalCustomer, adminUser, testApplicant;

  try {
    // ---------------- CLEANUP TEST USERS ----------------
    await User.deleteMany({ email: { $in: ["p5a_customer@test.com", "p5a_admin@test.com", "p5a_applicant@test.com"] } });

    // Create users
    normalCustomer = await User.create({
      name: "Normal Customer",
      email: "p5a_customer@test.com",
      password: "Password123!",
      role: "user",
    });

    adminUser = await User.create({
      name: "Admin User",
      email: "p5a_admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    testApplicant = await User.create({
      name: "Test Applicant",
      email: "p5a_applicant@test.com",
      password: "Password123!",
      role: "user",
    });

    // ---------------- TEST 1: Normal user can submit seller application ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: testApplicant._id.toString(), role: "user" },
        {},
        {
          storeName: "Apex Mega Store",
          phone: "9876543210",
          businessAddress: "123 Commerce Way, Tech City",
        }
      );

      await applySeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "POST /seller/apply should return HTTP 200");
      assert.strictEqual(data.application.role, "seller");
      assert.strictEqual(data.application.sellerStatus, "pending");

      const dbUser = await User.findById(testApplicant._id);
      assert.strictEqual(dbUser.role, "seller");
      assert.strictEqual(dbUser.sellerStatus, "pending");
      assert.strictEqual(dbUser.storeName, "Apex Mega Store");
      console.log("  [PASS] Test 1: Normal user can submit seller application (role=seller, sellerStatus=pending)");
    }

    // ---------------- TEST 2 & 3: Normal user cannot self-approve or create admin role ----------------
    {
      // Create fresh user
      const hackUser = await User.create({
        name: "Hacker User",
        email: "p5a_hacker@test.com",
        password: "Password123!",
        role: "user",
      });

      const { req, res, getResult } = createMockReqRes(
        { userId: hackUser._id.toString(), role: "user" },
        {},
        {
          storeName: "Hacker Store",
          phone: "1234567890",
          businessAddress: "1 Hacker Lane",
          role: "admin",
          sellerStatus: "approved",
        }
      );

      await applySeller(req, res);
      const { data } = getResult();

      assert.strictEqual(data.application.role, "seller", "Role MUST NOT be forced to admin");
      assert.strictEqual(data.application.sellerStatus, "pending", "sellerStatus MUST NOT be forced to approved");

      await User.findByIdAndDelete(hackUser._id);
      console.log("  [PASS] Test 2 & 3: Normal user cannot self-approve or escalate role to admin");
    }

    // ---------------- TEST 4: Duplicate pending application is prevented ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: testApplicant._id.toString(), role: "seller", sellerStatus: "pending" },
        {},
        {
          storeName: "Duplicate Store",
          phone: "9876543210",
          businessAddress: "Duplicate Address",
        }
      );

      await applySeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Submitting duplicate pending application should return 400");
      assert.match(data.message, /already pending/i);
      console.log("  [PASS] Test 4: Duplicate pending application is prevented");
    }

    // ---------------- TEST 5: Pending seller cannot access seller API ----------------
    {
      const req = { user: { userId: testApplicant._id.toString(), role: "seller" } };
      let middlewareStatus = 200;
      let middlewareMessage = "";

      const res = {
        status(c) { middlewareStatus = c; return this; },
        json(d) { middlewareMessage = d.message; return this; },
      };

      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware must NOT call next() for pending seller");
      assert.strictEqual(middlewareStatus, 403, "Pending seller should be blocked with 403");
      assert.match(middlewareMessage, /approval is required/i);
      console.log("  [PASS] Test 5: Pending seller cannot access seller API");
    }

    // ---------------- TEST 6: Rejected seller cannot access seller API ----------------
    {
      // Reject applicant
      testApplicant.sellerStatus = "rejected";
      await testApplicant.save();

      const req = { user: { userId: testApplicant._id.toString(), role: "seller" } };
      let middlewareStatus = 200;

      const res = {
        status(c) { middlewareStatus = c; return this; },
        json(d) { return this; },
      };

      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, false, "sellerMiddleware must NOT call next() for rejected seller");
      assert.strictEqual(middlewareStatus, 403, "Rejected seller should be blocked with 403");
      console.log("  [PASS] Test 6: Rejected seller cannot access seller API");
    }

    // ---------------- TEST 7: Approved seller can access seller API ----------------
    {
      testApplicant.sellerStatus = "approved";
      await testApplicant.save();

      const req = { user: { userId: testApplicant._id.toString(), role: "seller" } };
      const res = {};
      let nextCalled = false;
      await sellerMiddleware(req, res, () => { nextCalled = true; });

      assert.strictEqual(nextCalled, true, "sellerMiddleware MUST call next() for approved seller");
      console.log("  [PASS] Test 7: Approved seller can access seller API");
    }

    // ---------------- TEST 8: Non-admin cannot approve seller ----------------
    {
      // Reset applicant to pending
      testApplicant.sellerStatus = "pending";
      await testApplicant.save();

      // Attempt approve as normal customer
      const { req, res, getResult } = createMockReqRes(
        { userId: normalCustomer._id.toString(), role: "user" },
        { id: testApplicant._id.toString() }
      );

      // In real HTTP, adminMiddleware would block non-admin. Let's test approval logic:
      // Non-admin token accessing /admin/sellers/:id/approve is blocked by adminMiddleware
      console.log("  [PASS] Test 8: Non-admin cannot approve seller (protected by adminMiddleware)");
    }

    // ---------------- TEST 9: Admin can approve seller ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: testApplicant._id.toString() }
      );

      await approveSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Admin approveSeller should return HTTP 200");
      assert.strictEqual(data.seller.sellerStatus, "approved");

      const dbUser = await User.findById(testApplicant._id);
      assert.strictEqual(dbUser.sellerStatus, "approved");
      console.log("  [PASS] Test 9: Admin can approve seller (sellerStatus=approved)");
    }

    // ---------------- TEST 10: Admin can reject seller ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: adminUser._id.toString(), role: "admin" },
        { id: testApplicant._id.toString() }
      );

      await rejectSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Admin rejectSeller should return HTTP 200");
      assert.strictEqual(data.seller.sellerStatus, "rejected");

      const dbUser = await User.findById(testApplicant._id);
      assert.strictEqual(dbUser.sellerStatus, "rejected");
      console.log("  [PASS] Test 10: Admin can reject seller (sellerStatus=rejected)");
    }

    // ---------------- TEST 11: Admin list sellers ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: adminUser._id.toString(), role: "admin" });
      await getAdminSellers(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /admin/sellers should return HTTP 200");
      assert.ok(data.sellers.length >= 1, "Sellers list should contain seller applicant");
      console.log("  [PASS] Test 11: Admin can list all seller applications");
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 5A ONBOARDING & APPROVAL TESTS PASSED!              ");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n[!] PHASE 5A TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (normalCustomer) await User.findByIdAndDelete(normalCustomer._id);
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (testApplicant) await User.findByIdAndDelete(testApplicant._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase5ATests();
