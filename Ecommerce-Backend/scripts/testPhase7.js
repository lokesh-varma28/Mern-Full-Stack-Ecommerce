require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const assert = require("assert");
const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Cart = require("../Model/cartModel");
const Address = require("../Model/addressModel");
const Order = require("../Model/orderModel");
const { generateAccessToken } = require("../helper/token");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

let sellerA, tokenSellerA;
let sellerB, tokenSellerB;
let pendingSeller, tokenPendingSeller;
let rejectedSeller, tokenRejectedSeller;
let customerUser, tokenCustomer;
let adminUser, tokenAdmin;
let addressCustomer;
let productA1, productA2, productB;
let mixedOrder;

async function setupTestData() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[+] Connected to MongoDB for Phase 7 tests.");

  // Clean existing test data
  await User.deleteMany({
    email: {
      $in: [
        "p7_seller_a@test.com",
        "p7_seller_b@test.com",
        "p7_pending@test.com",
        "p7_rejected@test.com",
        "p7_customer@test.com",
        "p7_admin@test.com",
        "p7_new_reg@test.com",
      ],
    },
  });

  const hashPassword = await bcrypt.hash("Password123!", 10);

  // 1. Seller A (Approved)
  sellerA = await User.create({
    name: "Phase 7 Seller A",
    email: "p7_seller_a@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "approved",
    storeName: "Seller A Megastore",
    phone: "555-0101",
    businessAddress: "101 Market St",
    isVerified: true,
  });
  tokenSellerA = generateAccessToken(sellerA);

  // 2. Seller B (Approved)
  sellerB = await User.create({
    name: "Phase 7 Seller B",
    email: "p7_seller_b@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "approved",
    storeName: "Seller B Emporium",
    phone: "555-0102",
    businessAddress: "202 Commerce Way",
    isVerified: true,
  });
  tokenSellerB = generateAccessToken(sellerB);

  // 3. Pending Seller
  pendingSeller = await User.create({
    name: "Phase 7 Pending Seller",
    email: "p7_pending@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "pending",
    storeName: "Pending Store",
    phone: "555-0103",
    businessAddress: "303 Waiting Ave",
    isVerified: true,
  });
  tokenPendingSeller = generateAccessToken(pendingSeller);

  // 4. Rejected Seller
  rejectedSeller = await User.create({
    name: "Phase 7 Rejected Seller",
    email: "p7_rejected@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "rejected",
    storeName: "Rejected Store",
    phone: "555-0104",
    businessAddress: "404 Denied Rd",
    isVerified: true,
  });
  tokenRejectedSeller = generateAccessToken(rejectedSeller);

  // 5. Customer User
  customerUser = await User.create({
    name: "Phase 7 Customer",
    email: "p7_customer@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  tokenCustomer = generateAccessToken(customerUser);

  // 6. Admin User
  adminUser = await User.create({
    name: "Phase 7 Admin",
    email: "p7_admin@test.com",
    password: hashPassword,
    role: "admin",
    isVerified: true,
  });
  tokenAdmin = generateAccessToken(adminUser);

  // Customer Address
  addressCustomer = await Address.create({
    user: customerUser._id,
    fullName: "Alice Buyer",
    house: "789 Main Blvd",
    area: "Downtown",
    city: "Seattle",
    state: "WA",
    pincode: "98101",
    phone: "555-0999",
    mobile: "555-0999",
  });

  // Products
  productA1 = await Product.create({
    title: "Seller A Laptop",
    description: "High performance laptop",
    price: 1000,
    stock: 20,
    category: "Electronics",
    seller: sellerA._id,
    image: { url: "http://example.com/laptop.jpg", publicId: "laptop_id" },
  });

  productA2 = await Product.create({
    title: "Seller A Wireless Mouse",
    description: "Ergonomic wireless mouse",
    price: 500,
    stock: 30,
    category: "Electronics",
    seller: sellerA._id,
    image: { url: "http://example.com/mouse.jpg", publicId: "mouse_id" },
  });

  productB = await Product.create({
    title: "Seller B Mechanical Keyboard",
    description: "RGB Mechanical Keyboard",
    price: 2000,
    stock: 15,
    category: "Electronics",
    seller: sellerB._id,
    image: { url: "http://example.com/keyboard.jpg", publicId: "keyboard_id" },
  });
}

async function cleanupTestData() {
  await User.deleteMany({
    email: {
      $in: [
        "p7_seller_a@test.com",
        "p7_seller_b@test.com",
        "p7_pending@test.com",
        "p7_rejected@test.com",
        "p7_customer@test.com",
        "p7_admin@test.com",
        "p7_new_reg@test.com",
      ],
    },
  });
  if (addressCustomer) await Address.deleteMany({ _id: addressCustomer._id });
  await Product.deleteMany({
    _id: { $in: [productA1?._id, productA2?._id, productB?._id] },
  });
  await Cart.deleteMany({ user: customerUser?._id });
  if (mixedOrder) await Order.deleteMany({ _id: mixedOrder._id });
  await mongoose.disconnect();
  console.log("[+] Phase 7 test data cleaned up and MongoDB disconnected.");
}

async function runTests() {
  await setupTestData();

  console.log("\n=================================================================");
  console.log("   Starting Phase 7 — Complete Seller Portal Security & E2E Tests");
  console.log("=================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: New seller registration creates role=seller
    // TEST 2: New seller starts as pending
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName: "New Fresh Seller Store",
          name: "Fresh Seller Owner",
          email: "p7_new_reg@test.com",
          phone: "+1 555-0777",
          businessAddress: "777 Market Lane",
          password: "Password123!",
          role: "seller",
        }),
      });

      const data = await res.json();
      if (res.status !== 201) {
        console.error("Test 1 Failed Response:", res.status, data);
      }
      assert.strictEqual(res.status, 201, `New seller registration should return HTTP 201 (${JSON.stringify(data)})`);

      const dbUser = await User.findOne({ email: "p7_new_reg@test.com" });
      assert.notStrictEqual(dbUser, null, "New seller must exist in DB");
      assert.strictEqual(dbUser.role, "seller", "Test 1 Pass: New seller role must be 'seller'");
      assert.strictEqual(dbUser.sellerStatus, "pending", "Test 2 Pass: New seller sellerStatus must be 'pending'");
      console.log("  [PASS] Test 1 & 2: New seller registration creates role='seller' and sellerStatus='pending'");
    }

    // -------------------------------------------------------------------------
    // TEST 3: Pending seller cannot access dashboard
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenPendingSeller}` },
      });
      assert.strictEqual(res.status, 403, "Pending seller accessing dashboard should return HTTP 403");
      console.log("  [PASS] Test 3: Pending seller cannot access dashboard (HTTP 403)");
    }

    // -------------------------------------------------------------------------
    // TEST 4: Approved seller can login and access dashboard
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      assert.strictEqual(res.status, 200, "Approved seller accessing dashboard should return HTTP 200");
      console.log("  [PASS] Test 4: Approved seller can access dashboard (HTTP 200)");
    }

    // -------------------------------------------------------------------------
    // TEST 5: Rejected seller cannot access dashboard
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenRejectedSeller}` },
      });
      assert.strictEqual(res.status, 403, "Rejected seller accessing dashboard should return HTTP 403");
      console.log("  [PASS] Test 5: Rejected seller cannot access dashboard (HTTP 403)");
    }

    // -------------------------------------------------------------------------
    // TEST 6: Seller A sees only Seller A products
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/products`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.products.length, 2, "Seller A should see exactly 2 products");
      const containsB = data.products.some((p) => p._id.toString() === productB._id.toString());
      assert.strictEqual(containsB, false, "Seller A MUST NOT see Seller B product");
      console.log("  [PASS] Test 6: Seller A sees only Seller A products");
    }

    // -------------------------------------------------------------------------
    // CREATE MIXED-SELLER ORDER FOR END-TO-END VERIFICATION
    // Customer buys: Product A1 (₹1,000) + Product A2 (₹500) + Product B (₹2,000) = Total ₹3,500
    // -------------------------------------------------------------------------
    await Cart.create({
      user: customerUser._id,
      items: [
        { product: productA1._id, quantity: 1 },
        { product: productA2._id, quantity: 1 },
        { product: productB._id, quantity: 1 },
      ],
    });

    const codRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomer}`,
      },
      body: JSON.stringify({
        shippingAddress: addressCustomer._id.toString(),
        finalAmount: 3500,
      }),
    });
    const codData = await codRes.json();
    assert.strictEqual(codRes.status, 201, "COD order placement should succeed");
    mixedOrder = codData.order;
    console.log(`[+] Created E2E Mixed Order #${mixedOrder._id} for ₹3,500`);

    // -------------------------------------------------------------------------
    // TEST 7: Seller A sees only Seller A order items
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.orders.length, 1, "Seller A should receive 1 order");
      const orderA = data.orders[0];
      assert.strictEqual(orderA.items.length, 2, "Seller A order should contain only 2 items (A1 + A2)");
      const hasBItem = orderA.items.some(
        (i) => i.seller && i.seller.toString() === sellerB._id.toString()
      );
      assert.strictEqual(hasBItem, false, "Seller A order MUST NOT contain Seller B item");
      console.log("  [PASS] Test 7: Seller A sees only Seller A order items");
    }

    // -------------------------------------------------------------------------
    // TEST 8 & 16: Seller A revenue (₹1,500) and Seller B revenue (₹2,000) separation
    // -------------------------------------------------------------------------
    {
      const resA = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const dataA = await resA.json();

      const resB = await fetch(`${BASE_URL}/seller/analytics`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerB}` },
      });
      const dataB = await resB.json();

      assert.strictEqual(dataA.analytics.sellerRevenue, 1500, "Seller A revenue must be ₹1,500");
      assert.strictEqual(dataA.analytics.totalItemsSold, 2, "Seller A units sold must be 2");

      assert.strictEqual(dataB.analytics.sellerRevenue, 2000, "Seller B revenue must be ₹2,000");
      assert.strictEqual(dataB.analytics.totalItemsSold, 1, "Seller B units sold must be 1");
      console.log("  [PASS] Test 8 & 16: Mixed-seller order revenue correctly separated (Seller A: ₹1,500, Seller B: ₹2,000)");
    }

    // -------------------------------------------------------------------------
    // TEST 9: Seller A sees only customers who purchased Seller A products
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/customers`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      assert.strictEqual(data.customers.length, 1, "Seller A should see 1 customer");
      const cust = data.customers[0];
      assert.strictEqual(cust.name, "Alice Buyer");
      assert.strictEqual(cust.totalSpent, 1500, "Customer total spent with Seller A must be ₹1,500");
      console.log("  [PASS] Test 9: Seller A sees relevant buyer info with Seller A total spent (₹1,500)");
    }

    // -------------------------------------------------------------------------
    // TEST 10: Seller A cannot query Seller B customer data
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/customers?sellerId=${sellerB._id.toString()}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      // Even with query param, seller identity is bound strictly to JWT token
      const cust = data.customers[0];
      assert.strictEqual(cust.totalSpent, 1500, "Seller A cannot query Seller B customer data via query param manipulation");
      console.log("  [PASS] Test 10: Seller A cannot query Seller B customer data (strictly bound to JWT identity)");
    }

    // -------------------------------------------------------------------------
    // TEST 11: Seller A cannot modify Seller B products
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/products/${productB._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSellerA}`,
        },
        body: JSON.stringify({ title: "Hacked Keyboard Title" }),
      });
      assert.strictEqual(res.status, 404, "Modifying Seller B product should return HTTP 404 Access Denied");
      const dbProdB = await Product.findById(productB._id);
      assert.strictEqual(dbProdB.title, "Seller B Mechanical Keyboard", "Product B title must remain unchanged");
      console.log("  [PASS] Test 11: Seller A cannot modify Seller B product");
    }

    // -------------------------------------------------------------------------
    // TEST 12: Seller A cannot modify Seller B orders
    // -------------------------------------------------------------------------
    {
      const itemBId = mixedOrder.items.find(
        (i) => i.product.toString() === productB._id.toString()
      )._id;

      const res = await fetch(
        `${BASE_URL}/seller/orders/${mixedOrder._id}/items/${itemBId}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenSellerA}`,
          },
          body: JSON.stringify({ status: "confirmed" }),
        }
      );
      assert.ok(res.status === 403 || res.status === 404, "Modifying Seller B order item should return 403/404");
      console.log("  [PASS] Test 12: Seller A cannot modify Seller B order item status");
    }

    // -------------------------------------------------------------------------
    // TEST 13: Seller cannot change their role to admin
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSellerA}`,
        },
        body: JSON.stringify({
          role: "admin", // Attempting self promotion
          storeName: "Hacked Admin Store",
        }),
      });

      const dbSellerA = await User.findById(sellerA._id);
      assert.strictEqual(dbSellerA.role, "seller", "Seller role must remain 'seller'");
      console.log("  [PASS] Test 13: Seller cannot self-promote to admin role");
    }

    // -------------------------------------------------------------------------
    // TEST 14: Seller cannot change their sellerId via product creation
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSellerA}`,
        },
        body: JSON.stringify({
          title: "Malicious Product",
          description: "Malicious description",
          price: 100,
          stock: 5,
          seller: sellerB._id.toString(), // Attempting to pass Seller B ID
          image: { url: "http://example.com/mal.jpg", publicId: "mal_id" },
        }),
      });
      assert.strictEqual(res.status, 400, "Passing protected 'seller' field should return HTTP 400");
      console.log("  [PASS] Test 14: Seller cannot overwrite product seller ownership");
    }

    // -------------------------------------------------------------------------
    // TEST 15: Seller cannot approve themselves
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/admin/sellers/${pendingSeller._id}/approve`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${tokenPendingSeller}` },
      });
      assert.strictEqual(res.status, 403, "Self approval using pending seller token should return HTTP 403");
      const dbPending = await User.findById(pendingSeller._id);
      assert.strictEqual(dbPending.sellerStatus, "pending", "Pending seller must remain pending");
      console.log("  [PASS] Test 15: Seller cannot approve themselves (HTTP 403)");
    }

    // -------------------------------------------------------------------------
    // TEST 17: Customer still sees complete mixed-seller order (₹3,500)
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/orders/${mixedOrder._id}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenCustomer}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      const custOrder = data.order || data;
      assert.strictEqual(custOrder.items.length, 3, "Customer should see all 3 items in mixed order");
      assert.strictEqual(custOrder.finalAmount || custOrder.totalAmount, 3500, "Customer sees complete ₹3,500 total amount");
      console.log("  [PASS] Test 17: Customer sees complete mixed-seller order (3 items, total ₹3,500)");
    }

    // -------------------------------------------------------------------------
    // TEST 18: Admin still sees complete order data across all sellers
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/admin/orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      const data = await res.json();
      assert.strictEqual(res.status, 200);
      const allOrders = Array.isArray(data) ? data : data.orders || [];
      const adminOrder = allOrders.find((o) => o._id.toString() === mixedOrder._id.toString());
      assert.notStrictEqual(adminOrder, null, "Admin must see mixed order");
      assert.strictEqual(adminOrder.items.length, 3, "Admin sees all 3 items across all sellers");
      console.log("  [PASS] Test 18: Admin sees complete order data across all sellers");
    }

    console.log("\n=================================================================");
    console.log("   ALL 18 PHASE 7 SECURITY & END-TO-END TESTS PASSED!            ");
    console.log("=================================================================\n");
  } finally {
    await cleanupTestData();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
