require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Cart = require("../Model/cartModel");
const Address = require("../Model/addressModel");
const Order = require("../Model/orderModel");
const { generateAccessToken } = require("../helper/token");

const BASE_URL = `http://localhost:${process.env.PORT || 3000}`;

let customerUser, token, address, inStockProduct, outOfStockProduct;

async function setupTestData() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[+] Connected to MongoDB for Phase 6C tests.");

  // Clean test user
  await User.deleteMany({ email: "phase6c_customer@test.com" });

  const hashPassword = await bcrypt.hash("Password123!", 10);
  customerUser = await User.create({
    name: "Phase 6C Customer",
    email: "phase6c_customer@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  token = generateAccessToken(customerUser);

  // Address
  address = await Address.create({
    user: customerUser._id,
    fullName: "Phase 6C User",
    house: "456 Market St",
    area: "Midtown",
    city: "San Francisco",
    state: "CA",
    pincode: "94103",
    phone: "555-0199",
    mobile: "555-0199",
  });

  // Products
  inStockProduct = await Product.create({
    title: "Phase 6C In-Stock Product",
    price: 100,
    stock: 10,
    category: "Electronics",
    description: "Sample product with stock",
    image: { url: "http://example.com/instock.jpg", publicId: "instock_id" },
  });

  outOfStockProduct = await Product.create({
    title: "Phase 6C Out-Of-Stock Product",
    price: 150,
    stock: 0,
    category: "Electronics",
    description: "Sample product without stock",
    image: { url: "http://example.com/outofstock.jpg", publicId: "outofstock_id" },
  });
}

async function cleanupTestData() {
  await User.deleteMany({ email: "phase6c_customer@test.com" });
  if (address) await Address.deleteMany({ _id: address._id });
  if (inStockProduct) await Product.deleteMany({ _id: inStockProduct._id });
  if (outOfStockProduct) await Product.deleteMany({ _id: outOfStockProduct._id });
  if (customerUser) {
    await Cart.deleteMany({ user: customerUser._id });
    await Order.deleteMany({ userId: customerUser._id });
  }
  await mongoose.disconnect();
  console.log("[+] Phase 6C test data cleaned up and MongoDB disconnected.");
}

async function runTests() {
  await setupTestData();

  console.log("\n=================================================================");
  console.log("   Starting Phase 6C — Customer Checkout & Payment Flow Tests    ");
  console.log("=================================================================\n");

  try {
    // -------------------------------------------------------------------------
    // TEST 1: Unauthenticated Checkout
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/payment/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (res.status === 401) {
        console.log("  [PASS] Test 1: Unauthenticated checkout rejected (HTTP 401)");
      } else {
        throw new Error(`Test 1 Failed: Expected HTTP 401, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 2: Empty Cart Checkout
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/payment/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      if (res.status === 400) {
        console.log("  [PASS] Test 2: Empty cart checkout rejected (HTTP 400)");
      } else {
        throw new Error(`Test 2 Failed: Expected HTTP 400, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 3: Out-of-Stock Product Checkout
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/payment/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ buyNowProductId: outOfStockProduct._id.toString() }),
      });
      if (res.status === 400) {
        console.log("  [PASS] Test 3: Out-of-stock product checkout rejected (HTTP 400)");
      } else {
        throw new Error(`Test 3 Failed: Expected HTTP 400, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 4: Normal Customer COD Checkout
    // -------------------------------------------------------------------------
    {
      // Add product to cart
      await Cart.create({
        user: customerUser._id,
        items: [{ product: inStockProduct._id, quantity: 2 }],
      });

      const res = await fetch(`${BASE_URL}/payment/cod`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          shippingAddress: address._id.toString(),
          finalAmount: 200,
        }),
      });
      const data = await res.json();

      if (res.status === 201 && data.success && data.order) {
        // Verify product stock decremented from 10 to 8
        const updatedProd = await Product.findById(inStockProduct._id);
        // Verify cart cleared
        const userCart = await Cart.findOne({ user: customerUser._id });

        if (updatedProd.stock === 8 && userCart.items.length === 0) {
          console.log(
            "  [PASS] Test 4: Normal COD checkout places order, decrements stock, and clears cart (HTTP 201)"
          );
        } else {
          throw new Error(
            `Test 4 Failed: Stock: ${updatedProd.stock} (expected 8), Cart items: ${userCart.items.length} (expected 0)`
          );
        }
      } else {
        throw new Error(
          `Test 4 Failed: Expected HTTP 201, got HTTP ${res.status} (${JSON.stringify(data)})`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 5: Online Payment Initiate & Verification Flow
    // -------------------------------------------------------------------------
    let razorpayOrder = null;
    {
      // Re-populate cart
      await Cart.findOneAndUpdate(
        { user: customerUser._id },
        { $set: { items: [{ product: inStockProduct._id, quantity: 1 }] } }
      );

      const res = await fetch(`${BASE_URL}/payment/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await res.json();

      if (res.status === 200 && data.order?.id) {
        razorpayOrder = data.order;
        console.log("  [PASS] Test 5a: Razorpay payment initiated successfully (HTTP 200)");
      } else {
        throw new Error(
          `Test 5a Failed: Expected HTTP 200, got HTTP ${res.status} (${JSON.stringify(data)})`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 6: Invalid Payment Signature Rejection
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: "pay_bad_123",
          razorpay_signature: "bad_signature_hash",
          shippingAddress: address._id.toString(),
        }),
      });
      if (res.status === 400) {
        console.log(
          "  [PASS] Test 6: Invalid payment signature rejected (HTTP 400)"
        );
      } else {
        throw new Error(`Test 6 Failed: Expected HTTP 400, got HTTP ${res.status}`);
      }
    }

    // -------------------------------------------------------------------------
    // TEST 7: Valid Payment Verification & Order Creation
    // -------------------------------------------------------------------------
    const testPaymentId = `pay_valid_${Date.now()}`;
    const bodyStr = razorpayOrder.id + "|" + testPaymentId;
    const validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(bodyStr)
      .digest("hex");

    let firstCreatedOrderId = null;
    {
      const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
          shippingAddress: address._id.toString(),
        }),
      });
      const data = await res.json();

      if (res.status === 200 && data.success && data.order) {
        firstCreatedOrderId = data.order._id;
        // Verify stock decremented from 8 to 7
        const updatedProd = await Product.findById(inStockProduct._id);
        if (updatedProd.stock === 7) {
          console.log(
            "  [PASS] Test 7: Valid payment verified and order created (HTTP 200)"
          );
        } else {
          throw new Error(
            `Test 7 Failed: Expected stock 7, got ${updatedProd.stock}`
          );
        }
      } else {
        throw new Error(
          `Test 7 Failed: Expected HTTP 200, got HTTP ${res.status} (${JSON.stringify(data)})`
        );
      }
    }

    // -------------------------------------------------------------------------
    // TEST 8: Idempotency Verification (No Duplicate Orders Created)
    // -------------------------------------------------------------------------
    {
      const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          razorpay_order_id: razorpayOrder.id,
          razorpay_payment_id: testPaymentId,
          razorpay_signature: validSignature,
          shippingAddress: address._id.toString(),
        }),
      });
      const data = await res.json();

      const orderCount = await Order.countDocuments({
        paymentId: testPaymentId,
      });

      if (
        res.status === 200 &&
        data.order._id === firstCreatedOrderId &&
        orderCount === 1
      ) {
        console.log(
          "  [PASS] Test 8: Idempotency verified — duplicate verify call returned existing order and created zero duplicates (HTTP 200)"
        );
      } else {
        throw new Error(
          `Test 8 Failed: Duplicate verify call created ${orderCount} orders`
        );
      }
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 6C CUSTOMER CHECKOUT & PAYMENT TESTS PASSED!        ");
    console.log("=================================================================\n");
  } finally {
    await cleanupTestData();
  }
}

runTests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
