require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Cart = require("../Model/cartModel");
const Address = require("../Model/addressModel");
const Order = require("../Model/orderModel");
const { generateAccessToken } = require("../helper/token");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

let customerA, tokenCustomerA;
let customerB, tokenCustomerB;
let sellerA, tokenSellerA;
let sellerB, tokenSellerB;
let adminUser, tokenAdmin;
let addressA, productA1, productA2, productB;

async function setupTestData() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[+] Connected to MongoDB for Phase 6D tests.");

  // Clean test accounts
  await User.deleteMany({
    email: {
      $in: [
        "phase6d_customer_a@test.com",
        "phase6d_customer_b@test.com",
        "phase6d_seller_a@test.com",
        "phase6d_seller_b@test.com",
        "phase6d_admin@test.com",
      ],
    },
  });

  const hashPassword = await bcrypt.hash("Password123!", 10);

  // Customer A
  customerA = await User.create({
    name: "Phase 6D Customer A",
    email: "phase6d_customer_a@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  tokenCustomerA = generateAccessToken(customerA);

  // Customer B
  customerB = await User.create({
    name: "Phase 6D Customer B",
    email: "phase6d_customer_b@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  tokenCustomerB = generateAccessToken(customerB);

  // Approved Seller A
  sellerA = await User.create({
    name: "Phase 6D Seller A",
    email: "phase6d_seller_a@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "approved",
    storeName: "Seller A Superstore",
    isVerified: true,
  });
  tokenSellerA = generateAccessToken(sellerA);

  // Approved Seller B
  sellerB = await User.create({
    name: "Phase 6D Seller B",
    email: "phase6d_seller_b@test.com",
    password: hashPassword,
    role: "seller",
    sellerStatus: "approved",
    storeName: "Seller B Electronics",
    isVerified: true,
  });
  tokenSellerB = generateAccessToken(sellerB);

  // Admin User
  adminUser = await User.create({
    name: "Phase 6D Admin",
    email: "phase6d_admin@test.com",
    password: hashPassword,
    role: "admin",
    isVerified: true,
  });
  tokenAdmin = generateAccessToken(adminUser);

  // Address for Customer A
  addressA = await Address.create({
    user: customerA._id,
    fullName: "Customer A Address",
    house: "100 Main St",
    area: "Central",
    city: "San Jose",
    state: "CA",
    pincode: "95112",
    phone: "555-0100",
    mobile: "555-0100",
  });

  // Products owned by Seller A (Product A1: ₹1,000, Product A2: ₹500)
  productA1 = await Product.create({
    title: "Seller A Item 1",
    description: "Sample description A1",
    price: 1000,
    stock: 50,
    category: "Gadgets",
    seller: sellerA._id,
    image: { url: "http://example.com/a1.jpg", publicId: "a1_id" },
  });

  productA2 = await Product.create({
    title: "Seller A Item 2",
    description: "Sample description A2",
    price: 500,
    stock: 50,
    category: "Gadgets",
    seller: sellerA._id,
    image: { url: "http://example.com/a2.jpg", publicId: "a2_id" },
  });

  // Product owned by Seller B (Product B: ₹2,000)
  productB = await Product.create({
    title: "Seller B Item 1",
    description: "Sample description B1",
    price: 2000,
    stock: 50,
    category: "Appliances",
    seller: sellerB._id,
    image: { url: "http://example.com/b1.jpg", publicId: "b1_id" },
  });
}

async function cleanupTestData() {
  await User.deleteMany({
    email: {
      $in: [
        "phase6d_customer_a@test.com",
        "phase6d_customer_b@test.com",
        "phase6d_seller_a@test.com",
        "phase6d_seller_b@test.com",
        "phase6d_admin@test.com",
      ],
    },
  });
  if (addressA) await Address.deleteMany({ _id: addressA._id });
  await Product.deleteMany({
    _id: { $in: [productA1?._id, productA2?._id, productB?._id] },
  });
  await Cart.deleteMany({ user: { $in: [customerA?._id, customerB?._id] } });
  await Order.deleteMany({ userId: { $in: [customerA?._id, customerB?._id] } });
  await mongoose.disconnect();
  console.log("[+] Phase 6D test data cleaned up and MongoDB disconnected.");
}

async function runTests() {
  await setupTestData();

  console.log("\n=================================================================");
  console.log("   Starting Phase 6D — Seller Orders, Revenue & Security Tests   ");
  console.log("=================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // STEP 1: Create a Mixed-Seller Order
    // Customer A buys:
    //   - Product A1 (Seller A) × 1 = ₹1,000
    //   - Product A2 (Seller A) × 1 = ₹500
    //   - Product B  (Seller B) × 1 = ₹2,000
    // Total Customer Order Amount = ₹3,500
    // -------------------------------------------------------------------------
    await Cart.create({
      user: customerA._id,
      items: [
        { product: productA1._id, quantity: 1 },
        { product: productA2._id, quantity: 1 },
        { product: productB._id, quantity: 1 },
      ],
    });

    const placeRes = await fetch(`${BASE_URL}/payment/cod`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenCustomerA}`,
      },
      body: JSON.stringify({
        shippingAddress: addressA._id.toString(),
        finalAmount: 3500,
      }),
    });
    const placeData = await placeRes.json();

    if (placeRes.status !== 201 || !placeData.order) {
      throw new Error(
        `Mixed-seller order creation failed: HTTP ${placeRes.status} (${JSON.stringify(placeData)})`
      );
    }

    const mixedOrderId = placeData.order._id;
    console.log(`[+] Mixed-seller order created successfully: ${mixedOrderId} (Total ₹3,500)`);

    // Extract item IDs
    const itemA1 = placeData.order.items.find(
      (i) => i.product.toString() === productA1._id.toString()
    );
    const itemB = placeData.order.items.find(
      (i) => i.product.toString() === productB._id.toString()
    );

    // -------------------------------------------------------------------------
    // TEST 1: Seller A cannot read Seller B order items
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenSellerA}` },
      });
      const data = await res.json();
      if (res.status === 200 && data.orders.length > 0) {
        const orderForA = data.orders[0];
        const hasSellerBItems = orderForA.items.some(
          (i) => i.seller && i.seller.toString() === sellerB._id.toString()
        );
        if (!hasSellerBItems && orderForA.items.length === 2) {
          console.log(
            "  [PASS] Test 1: Seller A cannot read Seller B order items (sanitized item list returned)"
          );
        } else {
          throw new Error(
            `Test 1 Failed: Seller A received ${orderForA.items.length} items (expected 2)`
          );
        }
      } else {
        throw new Error(`Test 1 Failed: HTTP ${res.status} (${JSON.stringify(data)})`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 2: Seller A cannot update Seller B's order item status
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/seller/orders/${mixedOrderId}/items/${itemB._id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenSellerA}`,
          },
          body: JSON.stringify({ status: "confirmed" }),
        }
      );
      if (res.status === 404 || res.status === 403) {
        console.log(
          "  [PASS] Test 2: Seller A cannot update Seller B's order item status (HTTP 404/403)"
        );
      } else {
        throw new Error(
          `Test 2 Failed: Expected HTTP 404/403, got HTTP ${res.status}`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3 & 6: Seller A revenue & mixed-seller revenue separation
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

      const revA = dataA.analytics?.sellerRevenue;
      const revB = dataB.analytics?.sellerRevenue;

      if (revA === 1500 && revB === 2000) {
        console.log(
          "  [PASS] Test 3 & 6: Mixed-seller revenue is correctly separated (Seller A: ₹1,500, Seller B: ₹2,000)"
        );
      } else {
        throw new Error(
          `Test 3 & 6 Failed: Seller A Revenue: ₹${revA} (expected 1500), Seller B Revenue: ₹${revB} (expected 2000)`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: Mixed-seller order units sold are correctly separated
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

      const soldA = dataA.analytics?.totalItemsSold;
      const soldB = dataB.analytics?.totalItemsSold;

      if (soldA === 2 && soldB === 1) {
        console.log(
          "  [PASS] Test 7: Mixed-seller units sold correctly separated (Seller A: 2, Seller B: 1)"
        );
      } else {
        throw new Error(
          `Test 7 Failed: Seller A Units: ${soldA} (expected 2), Seller B Units: ${soldB} (expected 1)`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 4: Seller A cannot manipulate sellerId parameter to access Seller B
    // -------------------------------------------------------------------------
    {
      const res = await fetch(
        `${BASE_URL}/seller/orders?sellerId=${sellerB._id.toString()}`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenSellerA}` },
        }
      );
      const data = await res.json();
      if (res.status === 200) {
        const orderForA = data.orders[0];
        const hasSellerBItems = orderForA.items.some(
          (i) => i.seller && i.seller.toString() === sellerB._id.toString()
        );
        if (!hasSellerBItems) {
          console.log(
            "  [PASS] Test 4: Seller A cannot manipulate sellerId param (strictly bound to token identity)"
          );
        } else {
          throw new Error("Test 4 Failed: Seller A accessed Seller B data via sellerId query param");
        }
      }
    }

    // -------------------------------------------------------------------------
    // TEST 5: Seller A cannot create a product for Seller B
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/seller/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokenSellerA}`,
        },
        body: JSON.stringify({
          title: "Malicious Seller B Product",
          description: "Attempting to create product assigned to Seller B",
          price: 999,
          stock: 10,
          seller: sellerB._id.toString(), // Attempting to pass Seller B ID
          image: { url: "http://example.com/mal.jpg", publicId: "mal_id" },
        }),
      });

      if (res.status === 400) {
        console.log(
          "  [PASS] Test 5: Client attempt to supply 'seller' field rejected by protected field check (HTTP 400)"
        );
      } else {
        throw new Error(
          `Test 5 Failed: Expected HTTP 400 for protected field overwrite, got HTTP ${res.status}`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Admin can access all order information
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/admin/orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenAdmin}` },
      });
      const data = await res.json();
      const allOrders = Array.isArray(data) ? data : data.orders || [];
      if (res.status === 200 && allOrders.length > 0) {
        const adminOrder = allOrders.find((o) => o._id.toString() === mixedOrderId.toString());
        if (adminOrder && adminOrder.items.length === 3) {
          console.log(
            "  [PASS] Test 8: Admin can access complete order information across all sellers (HTTP 200)"
          );
        } else {
          throw new Error(`Test 8 Failed: Admin order ${adminOrder?._id} contained ${adminOrder?.items?.length} items (expected 3)`);
        }
      } else {
        throw new Error(`Test 8 Failed: HTTP ${res.status} (${JSON.stringify(data)})`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 9: Customer A can access only Customer A orders
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/orders`, {
        method: "GET",
        headers: { Authorization: `Bearer ${tokenCustomerB}` },
      });
      const data = await res.json();
      const customerBOrders = data.orders || data;
      if (res.status === 200 && customerBOrders.length === 0) {
        console.log(
          "  [PASS] Test 9: Customer B receives zero orders (Customer A's order inaccessible)"
        );
      } else {
        throw new Error(`Test 9 Failed: Customer B received ${customerBOrders.length} orders`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 10: Cancelled order items do not incorrectly increase seller revenue
    // -------------------------------------------------------------------------
    {
      // Seller A cancels Item A1
      const cancelRes = await fetch(
        `${BASE_URL}/seller/orders/${mixedOrderId}/items/${itemA1._id}/status`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${tokenSellerA}`,
          },
          body: JSON.stringify({ status: "cancelled" }),
        }
      );

      if (cancelRes.status === 200) {
        // Re-fetch Seller A analytics
        const resA = await fetch(`${BASE_URL}/seller/analytics`, {
          method: "GET",
          headers: { Authorization: `Bearer ${tokenSellerA}` },
        });
        const dataA = await resA.json();
        const updatedRevA = dataA.analytics?.sellerRevenue;
        const updatedUnitsA = dataA.analytics?.totalItemsSold;

        // Originally Product A1 (1000) + Product A2 (500) = 1500. After cancelling A1, revenue must be ₹500 and units = 1
        if (updatedRevA === 500 && updatedUnitsA === 1) {
          console.log(
            "  [PASS] Test 10: Cancelled items excluded from seller revenue & units sold (Revenue updated to ₹500)"
          );
        } else {
          throw new Error(
            `Test 10 Failed: Expected revenue ₹500 & units 1, got revenue ₹${updatedRevA} & units ${updatedUnitsA}`
          );
        }
      } else {
        throw new Error(`Test 10 Failed: Cancellation failed with HTTP ${cancelRes.status}`);
      }
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 6D SELLER ORDERS & SECURITY TESTS PASSED!           ");
    console.log("=================================================================\n");
  } finally {
    await cleanupTestData();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
