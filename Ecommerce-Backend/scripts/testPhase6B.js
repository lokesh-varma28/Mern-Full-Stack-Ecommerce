require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../Model/UserModel");
const { generateAccessToken } = require("../helper/token");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

let customerUser, sellerUser, adminUser, targetSellerUser;
let customerToken, sellerToken, adminToken, targetSellerToken;

async function setupTestData() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[+] Connected to MongoDB for Phase 6B tests.");

  // Clean existing test users if present
  await User.deleteMany({
    email: {
      $in: [
        "phase6b_customer@test.com",
        "phase6b_seller@test.com",
        "phase6b_admin@test.com",
        "phase6b_target@test.com",
        "phase6b_hacker@test.com",
      ],
    },
  });

  const hashPassword = await bcrypt.hash("Password123!", 10);

  // 1. Customer User
  customerUser = await User.create({
    name: "Phase 6B Customer",
    email: "phase6b_customer@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  customerToken = generateAccessToken(customerUser);

  // 2. Approved Seller User
  sellerUser = await User.create({
    name: "Phase 6B Approved Seller",
    email: "phase6b_seller@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "approved",
    storeName: "Phase 6B Approved Store",
    isVerified: true,
  });
  sellerToken = generateAccessToken(sellerUser);

  // 3. Admin User
  adminUser = await User.create({
    name: "Phase 6B Admin",
    email: "phase6b_admin@test.com",
    password: hashPassword,
    role: "admin",
    isVerified: true,
  });
  adminToken = generateAccessToken(adminUser);

  // 4. Target Pending Seller User
  targetSellerUser = await User.create({
    name: "Phase 6B Target Pending Seller",
    email: "phase6b_target@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "pending",
    storeName: "Phase 6B Target Store",
    isVerified: true,
  });
  targetSellerToken = generateAccessToken(targetSellerUser);
}

async function cleanupTestData() {
  await User.deleteMany({
    email: {
      $in: [
        "phase6b_customer@test.com",
        "phase6b_seller@test.com",
        "phase6b_admin@test.com",
        "phase6b_target@test.com",
        "phase6b_hacker@test.com",
      ],
    },
  });
  await mongoose.disconnect();
  console.log("[+] Test data cleaned up and MongoDB disconnected.");
}

async function runTests() {
  await setupTestData();

  console.log("\n=================================================================");
  console.log("   Starting Phase 6B — Seller Onboarding & Admin Approval Tests  ");
  console.log("=================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Customer cannot approve a seller
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/admin/sellers/${targetSellerUser._id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${customerToken}` },
        }
      );
      if (res.status === 403) {
        console.log("  [PASS] Test 1: Customer cannot approve seller (HTTP 403)");
      } else {
        throw new Error(`Test 1 Failed: Expected HTTP 403, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 2: Seller cannot approve another seller
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/admin/sellers/${targetSellerUser._id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${sellerToken}` },
        }
      );
      if (res.status === 403) {
        console.log("  [PASS] Test 2: Seller cannot approve another seller (HTTP 403)");
      } else {
        throw new Error(`Test 2 Failed: Expected HTTP 403, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3: Pending seller cannot access seller dashboard endpoints
    // -------------------------------------------------------------------------
    {
      const endpoints = [
        "/seller/analytics",
        "/seller/products",
        "/seller/orders",
        "/seller/profile",
      ];
      for (const endpoint of endpoints) {
        const res = await fetch(`${BASE_URL}${endpoint}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${targetSellerToken}` },
        });
        if (res.status !== 403) {
          throw new Error(
            `Test 3 Failed: Pending seller accessed ${endpoint} with HTTP ${res.status}`
          );
        }
      }
      console.log(
        "  [PASS] Test 3: Pending seller cannot access dashboard endpoints (HTTP 403)"
      );
    }

    // -------------------------------------------------------------------------
    // TEST 4: Approved seller can access dashboard endpoints
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      if (res.status === 200) {
        console.log("  [PASS] Test 4: Approved seller can access dashboard (HTTP 200)");
      } else {
        throw new Error(`Test 4 Failed: Expected HTTP 200, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 5: Admin can approve pending seller
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/admin/sellers/${targetSellerUser._id}/approve`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const data = await res.json();
      if (res.status === 200 && data.seller?.sellerStatus === "approved") {
        console.log("  [PASS] Test 5: Admin can approve pending seller (HTTP 200)");
      } else {
        throw new Error(`Test 5 Failed: Expected HTTP 200 approved, got ${res.status}`);
      }

      // Verify DB state directly
      const dbTarget = await User.findById(targetSellerUser._id);
      if (dbTarget.sellerStatus !== "approved" || dbTarget.role !== "seller") {
        throw new Error("Test 5 Failed: Target DB sellerStatus was not updated to approved");
      }
    }

    // -------------------------------------------------------------------------
    // TEST 6: Newly approved seller can now access dashboard
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${targetSellerToken}` },
      });
      if (res.status === 200) {
        console.log(
          "  [PASS] Test 6: Newly approved seller can access dashboard (HTTP 200)"
        );
      } else {
        throw new Error(`Test 6 Failed: Expected HTTP 200, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: Admin can reject seller
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/admin/sellers/${targetSellerUser._id}/reject`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${adminToken}` },
        }
      );
      const data = await res.json();
      if (res.status === 200 && data.seller?.sellerStatus === "rejected") {
        console.log("  [PASS] Test 7: Admin can reject seller (HTTP 200)");
      } else {
        throw new Error(`Test 7 Failed: Expected HTTP 200 rejected, got ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Rejected seller cannot access seller dashboard
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${targetSellerToken}` },
      });
      if (res.status === 403) {
        console.log(
          "  [PASS] Test 8: Rejected seller cannot access dashboard (HTTP 403)"
        );
      } else {
        throw new Error(
          `Test 8 Failed: Rejected seller accessed dashboard with HTTP ${res.status}`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 9: Client cannot self-promote to admin during registration
    // -------------------------------------------------------------------------
    {
      const registerRes = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Hacker User",
          email: "phase6b_hacker@test.com",
          password: "Password123!",
          role: "admin", // Malicious attempt to register as admin
        }),
      });

      if (registerRes.status === 400) {
        console.log(
          "  [PASS] Test 9: Self-promotion to admin rejected with HTTP 400 ('role' not allowed)"
        );
      } else {
        throw new Error(
          `Test 9 Failed: Expected HTTP 400 for admin registration attempt, got HTTP ${registerRes.status}`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 10: Customer onboarding application via POST /seller/apply sets role='seller' & sellerStatus='pending'
    // -------------------------------------------------------------------------
    {
      const applyRes = await fetch(`${BASE_URL}/seller/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${customerToken}`,
        },
        body: JSON.stringify({
          storeName: "New Onboarding Merchant Store",
          phone: "+1 555-0199",
          businessAddress: "100 Merchant Way, Suite 2",
        }),
      });

      const applyData = await applyRes.json();
      if (applyRes.status === 200 && applyData.application?.sellerStatus === "pending") {
        const customerDb = await User.findById(customerUser._id);
        if (
          customerDb &&
          customerDb.role === "seller" &&
          customerDb.sellerStatus === "pending"
        ) {
          console.log(
            "  [PASS] Test 10: Seller onboarding application sets role='seller' & sellerStatus='pending'"
          );
        } else {
          throw new Error(
            `Test 10 Failed: DB state after application: role='${customerDb?.role}', sellerStatus='${customerDb?.sellerStatus}'`
          );
        }
      } else {
        throw new Error(
          `Test 10 Failed: Expected HTTP 200, got HTTP ${applyRes.status} (${JSON.stringify(applyData)})`
        );
      }
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 6B SELLER ONBOARDING & ADMIN APPROVAL TESTS PASSED! ");
    console.log("=================================================================\n");
  } finally {
    await cleanupTestData();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
