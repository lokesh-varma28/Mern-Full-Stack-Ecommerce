require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");
const Cart = require("../Model/cartModel");

const {
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
  createSellerProduct,
} = require("../Controller/sellerProductController");

const {
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerAnalytics,
} = require("../Controller/sellerOrderController");

const { createOrderService } = require("../service/orderService");

// Helper to construct mock req/res objects
const createMockReqRes = (user, params = {}, body = {}, query = {}, file = null) => {
  let responseData = null;
  let responseStatus = 200;

  const req = {
    user,
    params,
    body,
    query,
    file,
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

async function runPhase4CVerification() {
  console.log("=================================================================");
  console.log("   Starting Phase 4C — Multi-Vendor End-to-End Verification      ");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let sellerA, sellerB, customer, address;
  let productA, productB;
  let createdOrder;

  try {
    // ---------------- CLEANUP TEST DATA ----------------
    await User.deleteMany({ email: { $in: ["p4c_seller_a@test.com", "p4c_seller_b@test.com", "p4c_customer@test.com"] } });

    // ---------------- 1. CREATE TEST USERS & ADDRESS ----------------
    sellerA = await User.create({
      name: "Phase 4C Seller A",
      email: "p4c_seller_a@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
    });

    sellerB = await User.create({
      name: "Phase 4C Seller B",
      email: "p4c_seller_b@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
    });

    customer = await User.create({
      name: "Phase 4C Customer",
      email: "p4c_customer@test.com",
      password: "Password123!",
      role: "user",
    });

    address = await Address.create({
      user: customer._id,
      fullName: "Jane Customer",
      mobile: "9876543210",
      pincode: "400001",
      house: "Flat 404, Tech Park",
      area: "Bandra",
      landmark: "Opposite Metro Station",
      city: "Mumbai",
      state: "Maharashtra",
      country: "India",
      isDefault: true,
    });

    // ---------------- 2. SELLER PRODUCT LIFECYCLE ----------------
    // Seller A creates Product A (₹500, stock 10)
    productA = await Product.create({
      title: "Product A (Seller A)",
      description: "Item from Seller A",
      price: 500,
      stock: 10,
      category: "Electronics",
      brand: "BrandA",
      image: { url: "https://example.com/pa.jpg", publicId: "pa_img" },
      seller: sellerA._id,
      isActive: true,
    });

    // Seller B creates Product B (₹1000, stock 5)
    productB = await Product.create({
      title: "Product B (Seller B)",
      description: "Item from Seller B",
      price: 1000,
      stock: 5,
      category: "Fashion",
      brand: "BrandB",
      image: { url: "https://example.com/pb.jpg", publicId: "pb_img" },
      seller: sellerB._id,
      isActive: true,
    });

    // Verify GET /seller/products isolation
    {
      const { req: reqA, res: resA, getResult: getResA } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerProducts(reqA, resA);
      const dataA = getResA().data;
      assert.strictEqual(dataA.products.length, 1, "Seller A should see exactly 1 product");
      assert.strictEqual(dataA.products[0]._id.toString(), productA._id.toString());

      const { req: reqB, res: resB, getResult: getResB } = createMockReqRes({ userId: sellerB._id.toString(), role: "seller" });
      await getSellerProducts(reqB, resB);
      const dataB = getResB().data;
      assert.strictEqual(dataB.products.length, 1, "Seller B should see exactly 1 product");
      assert.strictEqual(dataB.products[0]._id.toString(), productB._id.toString());
      console.log("  [PASS] Product Catalog Isolation (Seller A & B see only owned products)");
    }

    // Verify Seller A cannot PUT or DELETE Product B
    {
      const { req: reqPut, res: resPut, getResult: getResPut } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { id: productB._id.toString() },
        { title: "Unauthorized Edit" }
      );
      await updateSellerProduct(reqPut, resPut);
      assert.strictEqual(getResPut().status, 404, "Seller A PUT Product B must fail with 404");

      const { req: reqDel, res: resDel, getResult: getResDel } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { id: productB._id.toString() }
      );
      await deleteSellerProduct(reqDel, resDel);
      assert.strictEqual(getResDel().status, 404, "Seller A DELETE Product B must fail with 404");
      console.log("  [PASS] Product Modification Security (Seller A cannot edit/delete Seller B's product)");
    }

    // Verify Seller A updating Product A fields
    {
      const { req: reqEdit, res: resEdit, getResult: getResEdit } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { id: productA._id.toString() },
        { title: "Updated Product A Title", price: 550 }
      );
      await updateSellerProduct(reqEdit, resEdit);
      assert.strictEqual(getResEdit().status, 200, "Seller A updating Product A must succeed");

      const updatedA = await Product.findById(productA._id);
      assert.strictEqual(updatedA.title, "Updated Product A Title");
      assert.strictEqual(updatedA.price, 550);
      console.log("  [PASS] Product Editing (Title & price update verified)");
    }

    // Reset Product A price to 500 for checkout test
    const freshA = await Product.findById(productA._id);
    freshA.price = 500;
    await freshA.save();

    // ---------------- 3. MULTI-SELLER CHECKOUT INTEGRATION ----------------
    // Setup customer cart with Product A (qty 1) and Product B (qty 1)
    await Cart.findOneAndDelete({ user: customer._id });
    await Cart.create({
      user: customer._id,
      items: [
        { product: productA._id, quantity: 1 },
        { product: productB._id, quantity: 1 },
      ],
    });

    // Execute order creation service
    createdOrder = await createOrderService({
      userId: customer._id,
      email: customer.email,
      paymentMethod: "COD",
      shippingAddress: address._id,
    });

    assert.ok(createdOrder, "Order creation should return created order document");
    assert.strictEqual(createdOrder.finalAmount, 1500, "Order final amount must be 1500 (500 + 1000)");
    assert.strictEqual(createdOrder.items.length, 2, "Order must contain 2 items");

    // Verify seller snapshot on items
    const itemA = createdOrder.items.find((i) => i.product.toString() === productA._id.toString());
    const itemB = createdOrder.items.find((i) => i.product.toString() === productB._id.toString());

    assert.strictEqual(itemA.seller.toString(), sellerA._id.toString(), "Item A seller snapshot must match Seller A");
    assert.strictEqual(itemA.price, 500, "Item A price snapshot must be 500");
    assert.strictEqual(itemA.itemStatus, "pending", "Item A itemStatus must start as pending");

    assert.strictEqual(itemB.seller.toString(), sellerB._id.toString(), "Item B seller snapshot must match Seller B");
    assert.strictEqual(itemB.price, 1000, "Item B price snapshot must be 1000");
    assert.strictEqual(itemB.itemStatus, "pending", "Item B itemStatus must start as pending");

    // Verify stock reduction
    const updatedProdA = await Product.findById(productA._id);
    const updatedProdB = await Product.findById(productB._id);
    assert.strictEqual(updatedProdA.stock, 9, "Product A stock must be reduced from 10 to 9");
    assert.strictEqual(updatedProdB.stock, 4, "Product B stock must be reduced from 5 to 4");

    // Verify customer cart cleared
    const customerCart = await Cart.findOne({ user: customer._id });
    assert.strictEqual(customerCart.items.length, 0, "Customer cart must be cleared after checkout");

    console.log("  [PASS] Multi-Seller Checkout (Single order created, seller snapshots stored, stock reduced, cart cleared)");

    // ---------------- 4. SELLER ORDER ISOLATION ----------------
    // Seller A GET /seller/orders
    {
      const { req: reqOrderA, res: resOrderA, getResult: getResOrderA } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerOrders(reqOrderA, resOrderA);
      const ordersA = getResOrderA().data.orders;

      assert.strictEqual(ordersA.length, 1, "Seller A should see 1 order");
      assert.strictEqual(ordersA[0].items.length, 1, "Seller A should receive ONLY Product A in items array");
      assert.strictEqual(ordersA[0].items[0].seller.toString(), sellerA._id.toString());

      // Address Sanitization
      const addrA = ordersA[0].shippingAddress;
      assert.strictEqual(addrA.fullName, "Jane Customer");
      assert.strictEqual(addrA.user, undefined, "Customer user ObjectId reference MUST NOT be exposed");
      assert.strictEqual(addrA.isDefault, undefined, "Address default flag MUST NOT be exposed");
    }

    // Seller B GET /seller/orders
    {
      const { req: reqOrderB, res: resOrderB, getResult: getResOrderB } = createMockReqRes({ userId: sellerB._id.toString(), role: "seller" });
      await getSellerOrders(reqOrderB, resOrderB);
      const ordersB = getResOrderB().data.orders;

      assert.strictEqual(ordersB.length, 1, "Seller B should see 1 order");
      assert.strictEqual(ordersB[0].items.length, 1, "Seller B should receive ONLY Product B in items array");
      assert.strictEqual(ordersB[0].items[0].seller.toString(), sellerB._id.toString());
      console.log("  [PASS] Seller Order Isolation & Sanitization (Sellers receive only their own items, address sanitized)");
    }

    // ---------------- 5. ITEM-LEVEL STATUS WORKFLOW & ANALYTICS ----------------
    // Seller A status workflow: pending -> confirmed -> packed -> shipped -> delivered
    const itemAId = itemA._id;
    const itemBId = itemB._id;

    const statuses = ["confirmed", "packed", "shipped", "delivered"];
    for (const st of statuses) {
      const { req: reqSt, res: resSt, getResult: getResSt } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { orderId: createdOrder._id.toString(), itemId: itemAId.toString() },
        { status: st }
      );
      await updateSellerOrderItemStatus(reqSt, resSt);
      assert.strictEqual(getResSt().status, 200, `Setting Item A status to ${st} should succeed`);
    }

    // Verify Seller A cannot update Seller B's item status
    {
      const { req: reqHack, res: resHack, getResult: getResHack } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { orderId: createdOrder._id.toString(), itemId: itemBId.toString() },
        { status: "cancelled" }
      );
      await updateSellerOrderItemStatus(reqHack, resHack);
      assert.ok(getResHack().status === 403 || getResHack().status === 404, "Seller A updating Seller B item status must fail");
    }

    // Verify Seller Analytics Isolation
    {
      const { req: reqAnaA, res: resAnaA, getResult: getResAnaA } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerAnalytics(reqAnaA, resAnaA);
      const anaA = getResAnaA().data.analytics;
      assert.strictEqual(anaA.sellerRevenue, 500, "Seller A revenue must be ₹500");
      assert.strictEqual(anaA.totalItemsSold, 1, "Seller A total items sold must be 1");

      const { req: reqAnaB, res: resAnaB, getResult: getResAnaB } = createMockReqRes({ userId: sellerB._id.toString(), role: "seller" });
      await getSellerAnalytics(reqAnaB, resAnaB);
      const anaB = getResAnaB().data.analytics;
      assert.strictEqual(anaB.sellerRevenue, 1000, "Seller B revenue must be ₹1000");
      assert.strictEqual(anaB.totalItemsSold, 1, "Seller B total items sold must be 1");
      console.log("  [PASS] Status Workflow & Analytics Revenue Isolation (Seller A ₹500, Seller B ₹1000)");
    }

    // Cancel Seller A item and verify revenue exclusion
    {
      const { req: reqCancel, res: resCancel, getResult: getResCancel } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { orderId: createdOrder._id.toString(), itemId: itemAId.toString() },
        { status: "cancelled" }
      );
      await updateSellerOrderItemStatus(reqCancel, resCancel);

      const { req: reqAnaA2, res: resAnaA2, getResult: getResAnaA2 } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerAnalytics(reqAnaA2, resAnaA2);
      const anaA2 = getResAnaA2().data.analytics;
      assert.strictEqual(anaA2.sellerRevenue, 0, "Seller A revenue must be ₹0 after item cancellation");
      assert.strictEqual(anaA2.totalItemsSold, 0, "Seller A units sold must be 0 after item cancellation");
      console.log("  [PASS] Cancelled Item Revenue Exclusion (Cancelled items excluded from revenue & units sold)");
    }

    // ---------------- 6. HISTORICAL ORDERS INSPECTION ----------------
    {
      const historicalOrders = await Order.find({ _id: { $ne: createdOrder._id } }).limit(10);
      let totalHistoricalItems = 0;
      let itemsWithSeller = 0;

      for (const ho of historicalOrders) {
        for (const it of ho.items || []) {
          totalHistoricalItems++;
          if (it.seller) itemsWithSeller++;
        }
      }

      console.log(`  [INFO] Historical Orders Inspected: ${historicalOrders.length} orders (${totalHistoricalItems} items, ${itemsWithSeller} with seller snapshot).`);
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 4C END-TO-END VERIFICATION TESTS PASSED!            ");
    console.log("=================================================================\n");

  } catch (err) {
    console.error("\n[!] VERIFICATION FAILED:", err);
    process.exitCode = 1;
  } finally {
    // ---------------- CLEANUP TEST DATA ----------------
    if (createdOrder) await Order.findByIdAndDelete(createdOrder._id);
    if (productA) await Product.findByIdAndDelete(productA._id);
    if (productB) await Product.findByIdAndDelete(productB._id);
    if (address) await Address.findByIdAndDelete(address._id);
    if (sellerA) await User.findByIdAndDelete(sellerA._id);
    if (sellerB) await User.findByIdAndDelete(sellerB._id);
    if (customer) await User.findByIdAndDelete(customer._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase4CVerification();
