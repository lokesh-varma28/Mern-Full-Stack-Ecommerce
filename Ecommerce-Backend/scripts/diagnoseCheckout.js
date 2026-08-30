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

async function diagnoseCheckout() {
  await mongoose.connect(process.env.MONGO_URL);
  console.log("[+] Connected to MongoDB for Full Checkout Diagnosis.");

  // Clean test user
  await User.deleteMany({ email: "checkout_diag@test.com" });

  const hashPassword = await bcrypt.hash("Password123!", 10);
  const user = await User.create({
    name: "Checkout Diag Customer",
    email: "checkout_diag@test.com",
    password: hashPassword,
    role: "user",
    isVerified: true,
  });
  const token = generateAccessToken(user);

  // Address
  const address = await Address.create({
    user: user._id,
    fullName: "Diag User",
    house: "123 Main St",
    area: "Downtown",
    city: "New York",
    state: "NY",
    pincode: "10001",
    phone: "555-0199",
    mobile: "555-0199",
  });

  // Product
  const product = await Product.create({
    title: "Diag Test Product",
    price: 50,
    stock: 20,
    category: "Electronics",
    description: "Diag test product description",
    image: { url: "http://example.com/image.jpg", publicId: "sample_id" },
  });

  // Add item to cart
  await Cart.create({
    user: user._id,
    items: [{ product: product._id, quantity: 2 }],
  });

  console.log("\n--- TEST A: ONLINE CHECKOUT INITIATE ---");
  let razorpayOrder = null;
  try {
    const res = await fetch(`${BASE_URL}/payment/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    console.log("Online Checkout Initiate HTTP:", res.status);
    console.log("Online Checkout Data:", JSON.stringify(data, null, 2));
    razorpayOrder = data.order;
  } catch (err) {
    console.error("Online Checkout Error:", err);
  }

  console.log("\n--- TEST B: INVALID SIGNATURE PAYMENT VERIFICATION ---");
  try {
    const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrder?.id || "order_fake123",
        razorpay_payment_id: "pay_fake123",
        razorpay_signature: "invalid_signature_hash",
        shippingAddress: address._id.toString(),
      }),
    });
    const data = await res.json();
    console.log("Invalid Signature Verification HTTP:", res.status);
    console.log("Invalid Signature Response Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Invalid Signature Error:", err);
  }

  console.log("\n--- TEST C: VALID SIGNATURE PAYMENT VERIFICATION ---");
  let createdPaymentId = `pay_test_${Date.now()}`;
  let validSignature = "";
  if (razorpayOrder && razorpayOrder.id) {
    const bodyStr = razorpayOrder.id + "|" + createdPaymentId;
    validSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(bodyStr)
      .digest("hex");
  }

  let verifiedOrder = null;
  try {
    const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrder?.id,
        razorpay_payment_id: createdPaymentId,
        razorpay_signature: validSignature,
        shippingAddress: address._id.toString(),
      }),
    });
    const data = await res.json();
    console.log("Valid Payment Verification HTTP:", res.status);
    console.log("Valid Payment Verification Data:", JSON.stringify(data, null, 2));
    verifiedOrder = data.order;
  } catch (err) {
    console.error("Valid Payment Verification Error:", err);
  }

  console.log("\n--- TEST D: IDEMPOTENCY (DUPLICATE VERIFY CALL) ---");
  try {
    const res = await fetch(`${BASE_URL}/payment/verify-payment`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        razorpay_order_id: razorpayOrder?.id,
        razorpay_payment_id: createdPaymentId,
        razorpay_signature: validSignature,
        shippingAddress: address._id.toString(),
      }),
    });
    const data = await res.json();
    console.log("Duplicate Verify Call HTTP:", res.status);
    console.log("Duplicate Verify Call Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Duplicate Verify Error:", err);
  }

  console.log("\n--- TEST E: UNAUTHENTICATED CHECKOUT ---");
  try {
    const res = await fetch(`${BASE_URL}/payment/checkout`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    console.log("Unauthenticated Checkout HTTP:", res.status);
  } catch (err) {
    console.error("Unauthenticated Checkout Error:", err);
  }

  console.log("\n--- TEST F: EMPTY CART CHECKOUT ---");
  try {
    // Cart is now empty after successful payment
    const res = await fetch(`${BASE_URL}/payment/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });
    const data = await res.json();
    console.log("Empty Cart Checkout HTTP:", res.status);
    console.log("Empty Cart Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Empty Cart Checkout Error:", err);
  }

  // Clean up
  await User.deleteMany({ email: "checkout_diag@test.com" });
  await Address.deleteMany({ _id: address._id });
  await Product.deleteMany({ _id: product._id });
  await Cart.deleteMany({ user: user._id });
  await Order.deleteMany({ userId: user._id });
  await mongoose.disconnect();
}

diagnoseCheckout().catch(console.error);
