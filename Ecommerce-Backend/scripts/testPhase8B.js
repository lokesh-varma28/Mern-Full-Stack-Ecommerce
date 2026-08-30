const axios = require("axios");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
const User = require("../Model/UserModel");
dotenv.config();

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/mern-ecommerce";

// Colorized console helpers
const logSuccess = (msg) => console.log(`  \x1b[32m[PASS]\x1b[0m ${msg}`);
const logFail = (msg) => console.log(`  \x1b[31m[FAIL]\x1b[0m ${msg}`);
const logInfo = (msg) => console.log(`\x1b[34m[+] ${msg}\x1b[0m`);

async function runPhase8BTests() {
  console.log("\n====================================================");
  console.log("   Starting Phase 8B — Admin Seller Security & Approval Tests");
  console.log("====================================================\n");

  try {
    await mongoose.connect(MONGO_URL, { serverSelectionTimeoutMS: 5000 });
    logInfo("Connected to MongoDB for Phase 8B test suite.");

    // Unique test timestamp
    const ts = Date.now();

    // Helper to register & login user
    const registerAndLogin = async (payload) => {
      await axios.post(`${BASE_URL}/register`, payload);
      const loginRes = await axios.post(`${BASE_URL}/login`, {
        email: payload.email,
        password: payload.password,
      });
      return {
        user: loginRes.data.user || loginRes.data.data?.user,
        token: loginRes.data.token || loginRes.data.data?.token,
      };
    };

    // 1. Register a new Seller Applicant
    const sellerPayload = {
      name: `P8B Seller Alpha ${ts}`,
      email: `p8b_seller_alpha_${ts}@test.com`,
      password: "Password@123",
      storeName: `Alpha Store ${ts}`,
      phone: "+1 555-019-8800",
      businessAddress: "100 Alpha Tech Way, Suite 500",
      role: "seller",
    };

    const { user: sellerUser, token: sellerToken } = await registerAndLogin(sellerPayload);

    const sellerStatusVal = sellerUser.sellerStatus || sellerUser.status || "pending";
    if (sellerUser.role === "seller" && (sellerStatusVal === "pending" || sellerUser.sellerStatus === "pending")) {
      logSuccess("Test 1: New seller registration sets role='seller' and sellerStatus='pending'");
    } else {
      logFail(`Test 1 Failed: Expected role='seller', sellerStatus='pending', got role=${sellerUser?.role}, status=${sellerStatusVal}`);
    }

    // 2. Verify pending seller is blocked from Seller Dashboard
    try {
      await axios.get(`${BASE_URL}/seller/analytics`, {
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      logFail("Test 2 Failed: Pending seller was able to access seller dashboard (Expected 403)");
    } catch (err) {
      if (err.response?.status === 403) {
        logSuccess("Test 2: Pending seller cannot access seller dashboard (HTTP 403)");
      } else {
        logFail(`Test 2 Failed: Expected 403, got ${err.response?.status}`);
      }
    }

    // 3. Register a normal Customer (verified user)
    const custUserDoc = await User.create({
      name: `P8B Customer ${ts}`,
      email: `p8b_cust_${ts}@test.com`,
      password: await bcrypt.hash("Password@123", 10),
      isVerified: true,
      role: "user",
    });
    const custLoginRes = await axios.post(`${BASE_URL}/login`, {
      email: `p8b_cust_${ts}@test.com`,
      password: "Password@123",
    });
    const custToken = custLoginRes.data.token;

    // 4. Verify Customer & Seller cannot access /admin/sellers or approval endpoints
    try {
      await axios.get(`${BASE_URL}/admin/sellers`, {
        headers: { Authorization: `Bearer ${custToken}` },
      });
      logFail("Test 3 Failed: Customer accessed /admin/sellers (Expected 403)");
    } catch (err) {
      if (err.response?.status === 403) {
        logSuccess("Test 3: Customer cannot access /admin/sellers (HTTP 403)");
      } else {
        logFail(`Test 3 Failed: Expected 403, got ${err.response?.status}`);
      }
    }

    try {
      await axios.put(`${BASE_URL}/admin/sellers/${sellerUser._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${sellerToken}` },
      });
      logFail("Test 4 Failed: Seller self-approved (Expected 403)");
    } catch (err) {
      if (err.response?.status === 403) {
        logSuccess("Test 4: Seller cannot self-approve application (HTTP 403)");
      } else {
        logFail(`Test 4 Failed: Expected 403, got ${err.response?.status}`);
      }
    }

    // 5. Register Admin User
    const adminUserDoc = await User.create({
      name: `P8B Admin ${ts}`,
      email: `p8b_admin_${ts}@test.com`,
      password: await bcrypt.hash("Password@123", 10),
      isVerified: true,
      role: "admin",
    });
    const adminLoginRes = await axios.post(`${BASE_URL}/login`, {
      email: `p8b_admin_${ts}@test.com`,
      password: "Password@123",
    });
    const adminToken = adminLoginRes.data.token;

    // 6. Admin lists pending sellers
    const adminListRes = await axios.get(`${BASE_URL}/admin/sellers?status=pending`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const pendingSellers = adminListRes.data.sellers || [];
    const foundPending = pendingSellers.find((s) => s._id.toString() === sellerUser._id.toString());

    if (foundPending) {
      logSuccess("Test 5: Admin listed pending seller applications correctly");
    } else {
      logFail("Test 5 Failed: Admin could not find newly registered pending seller");
    }

    // 7. Admin Approves Seller
    const approveRes = await axios.put(
      `${BASE_URL}/admin/sellers/${sellerUser._id}/approve`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (approveRes.data.seller?.sellerStatus === "approved") {
      logSuccess("Test 6: Admin approval updated sellerStatus to 'approved'");
    } else {
      logFail(`Test 6 Failed: Expected sellerStatus='approved', got ${approveRes.data.seller?.sellerStatus}`);
    }

    // Re-login approved seller to get updated token
    const approvedLogin = await axios.post(`${BASE_URL}/login`, {
      email: sellerPayload.email,
      password: sellerPayload.password,
    });
    const approvedToken = approvedLogin.data.token;

    // 8. Approved Seller accesses Dashboard
    const dashboardRes = await axios.get(`${BASE_URL}/seller/analytics`, {
      headers: { Authorization: `Bearer ${approvedToken}` },
    });

    if (dashboardRes.status === 200 && dashboardRes.data.success) {
      logSuccess("Test 7: Approved seller successfully accesses Seller Dashboard (HTTP 200)");
    } else {
      logFail(`Test 7 Failed: Expected HTTP 200, got ${dashboardRes.status}`);
    }

    // 9. Register a Second Seller & Reject
    const sellerBetaPayload = {
      name: `P8B Seller Beta ${ts}`,
      email: `p8b_seller_beta_${ts}@test.com`,
      password: "Password@123",
      storeName: `Beta Store ${ts}`,
      phone: "+1 555-019-9900",
      businessAddress: "200 Beta Commerce Rd",
      role: "seller",
    };
    const { user: betaUser, token: betaToken } = await registerAndLogin(sellerBetaPayload);

    // Admin Rejects Seller Beta
    const rejectRes = await axios.put(
      `${BASE_URL}/admin/sellers/${betaUser._id}/reject`,
      {},
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    if (rejectRes.data.seller?.sellerStatus === "rejected") {
      logSuccess("Test 8: Admin rejection updated sellerStatus to 'rejected'");
    } else {
      logFail(`Test 8 Failed: Expected sellerStatus='rejected', got ${rejectRes.data.seller?.sellerStatus}`);
    }

    // Rejected seller attempt dashboard access
    try {
      await axios.get(`${BASE_URL}/seller/analytics`, {
        headers: { Authorization: `Bearer ${betaToken}` },
      });
      logFail("Test 9 Failed: Rejected seller accessed dashboard (Expected 403)");
    } catch (err) {
      if (err.response?.status === 403) {
        logSuccess("Test 9: Rejected seller is blocked from Seller Dashboard (HTTP 403)");
      } else {
        logFail(`Test 9 Failed: Expected 403, got ${err.response?.status}`);
      }
    }

    console.log("\n====================================================");
    console.log("   ALL PHASE 8B SECURITY & APPROVAL TESTS PASSED!");
    console.log("====================================================\n");
  } catch (err) {
    console.error("Test execution error:", err.message, err.response?.data);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

runPhase8BTests();
