require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");

const {
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../Controller/sellerProductController");

const {
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerAnalytics,
} = require("../Controller/sellerOrderController");

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

async function runTests() {
  console.log("=================================================");
  console.log("   Starting Phase 3D Seller Isolation Tests      ");
  console.log("=================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB successfully.");

  let sellerA, sellerB, customer, address;
  let productA, productB;
  let mixedOrder;

  try {
    // ---------------- CLEANUP PREVIOUS TEST DATA ----------------
    await User.deleteMany({ email: { $in: ["test_seller_a@test.com", "test_seller_b@test.com", "test_customer@test.com"] } });

    // ---------------- CREATE TEST USERS ----------------
    sellerA = await User.create({
      name: "Seller A",
      email: "test_seller_a@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
    });

    sellerB = await User.create({
      name: "Seller B",
      email: "test_seller_b@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
    });

    customer = await User.create({
      name: "Customer User",
      email: "test_customer@test.com",
      password: "Password123!",
      role: "user",
    });

    address = await Address.create({
      user: customer._id,
      fullName: "John Doe",
      mobile: "9876543210",
      pincode: "110001",
      house: "123 Main Street",
      area: "Downtown",
      landmark: "Near City Park",
      city: "New Delhi",
      state: "Delhi",
      country: "India",
      isDefault: true,
    });

    // ---------------- CREATE TEST PRODUCTS ----------------
    productA = await Product.create({
      title: "Seller A Product",
      description: "Awesome item by Seller A",
      price: 100,
      stock: 10,
      category: "Electronics",
      brand: "BrandA",
      image: { url: "https://example.com/a.jpg", publicId: "a_pic" },
      seller: sellerA._id,
    });

    productB = await Product.create({
      title: "Seller B Product",
      description: "Great item by Seller B",
      price: 250,
      stock: 5,
      category: "Books",
      brand: "BrandB",
      image: { url: "https://example.com/b.jpg", publicId: "b_pic" },
      seller: sellerB._id,
    });

    // ---------------- TEST 1: Seller A can GET only Seller A products ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerProducts(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /seller/products should return HTTP 200");
      assert.strictEqual(data.products.length, 1, "Seller A should see exactly 1 product");
      assert.strictEqual(data.products[0]._id.toString(), productA._id.toString(), "Seller A should see productA");
      console.log("  [PASS] Test 1: Seller A can GET only Seller A products");
    }

    // ---------------- TEST 2: Seller A cannot GET Seller B's product through /seller/products ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerProducts(req, res);
      const { data } = getResult();

      const containsB = data.products.some((p) => p._id.toString() === productB._id.toString());
      assert.strictEqual(containsB, false, "Seller A's product list MUST NOT contain Seller B's product");
      console.log("  [PASS] Test 2: Seller A cannot GET Seller B's product through /seller/products");
    }

    // ---------------- TEST 3: Seller A cannot PUT Seller B's product ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { id: productB._id.toString() },
        { title: "Hacked Title" }
      );
      await updateSellerProduct(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 404, "Updating Seller B product should return HTTP 404 Access Denied");
      assert.match(data.message, /not found or access denied/i);

      // Verify productB was not mutated in DB
      const dbProductB = await Product.findById(productB._id);
      assert.strictEqual(dbProductB.title, "Seller B Product", "Product B title must remain untouched");
      console.log("  [PASS] Test 3: Seller A cannot PUT Seller B's product");
    }

    // ---------------- TEST 4: Seller A cannot DELETE Seller B's product ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { id: productB._id.toString() }
      );
      await deleteSellerProduct(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 404, "Deleting Seller B product should return HTTP 404 Access Denied");

      // Verify productB still exists in DB
      const dbProductB = await Product.findById(productB._id);
      assert.notStrictEqual(dbProductB, null, "Product B must still exist in DB");
      console.log("  [PASS] Test 4: Seller A cannot DELETE Seller B's product");
    }

    // ---------------- CREATE MIXED SELLER ORDER ----------------
    mixedOrder = await Order.create({
      userId: customer._id,
      items: [
        {
          product: productA._id,
          quantity: 2,
          price: 100,
          seller: sellerA._id,
          itemStatus: "pending",
        },
        {
          product: productB._id,
          quantity: 1,
          price: 250,
          seller: sellerB._id,
          itemStatus: "pending",
        },
      ],
      totalAmount: 450,
      finalAmount: 450,
      paymentMethod: "COD",
      paymentStatus: "Pending",
      shippingAddress: address._id,
    });

    const itemAId = mixedOrder.items.find((i) => i.seller.toString() === sellerA._id.toString())._id;
    const itemBId = mixedOrder.items.find((i) => i.seller.toString() === sellerB._id.toString())._id;

    // ---------------- TEST 5: Seller A can see an order containing Seller A's item ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerOrders(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /seller/orders should return HTTP 200");
      assert.strictEqual(data.orders.length, 1, "Seller A should see the order containing Seller A's item");
      assert.strictEqual(data.orders[0]._id.toString(), mixedOrder._id.toString());
      console.log("  [PASS] Test 5: Seller A can see an order containing Seller A's item");
    }

    // ---------------- TEST 6: Seller A receives only Seller A's items from a mixed-seller order ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerOrders(req, res);
      const { data } = getResult();

      const returnedOrder = data.orders[0];
      assert.strictEqual(returnedOrder.items.length, 1, "Seller A should receive ONLY 1 item from mixed order");
      assert.strictEqual(returnedOrder.items[0].seller.toString(), sellerA._id.toString(), "Item seller must be Seller A");
      console.log("  [PASS] Test 6: Seller A receives only Seller A's items from a mixed-seller order");
    }

    // ---------------- TEST 7: Seller A cannot update Seller B's order item status ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { orderId: mixedOrder._id.toString(), itemId: itemBId.toString() },
        { status: "shipped" }
      );
      await updateSellerOrderItemStatus(req, res);
      const { status, data } = getResult();

      assert.ok(status === 403 || status === 404, `Updating Seller B's order item status should return 403 or 404 Access Denied (received ${status})`);
      assert.match(data.message, /access denied|not found/i);

      // Verify itemB status was NOT changed in DB
      const dbOrder = await Order.findById(mixedOrder._id);
      const dbItemB = dbOrder.items.id(itemBId);
      assert.strictEqual(dbItemB.itemStatus, "pending", "Item B status must remain 'pending'");
      console.log("  [PASS] Test 7: Seller A cannot update Seller B's order item status");
    }

    // ---------------- TEST 8: Seller A's analytics do not include Seller B revenue ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerAnalytics(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /seller/analytics should return HTTP 200");
      // Seller A revenue = productA price (100) * quantity (2) = 200. (Seller B's 250 revenue must be excluded)
      assert.strictEqual(data.analytics.sellerRevenue, 200, "Seller A revenue must be 200 (excluding Seller B revenue of 250)");
      assert.strictEqual(data.analytics.totalItemsSold, 2, "Seller A total items sold must be 2");
      console.log("  [PASS] Test 8: Seller A's analytics do not include Seller B revenue");
    }

    // ---------------- TEST 9: Cancelled seller items are excluded from seller revenue ----------------
    {
      // Cancel Seller A's item
      const { req, res, getResult } = createMockReqRes(
        { userId: sellerA._id.toString(), role: "seller" },
        { orderId: mixedOrder._id.toString(), itemId: itemAId.toString() },
        { status: "cancelled" }
      );
      await updateSellerOrderItemStatus(req, res);
      assert.strictEqual(getResult().status, 200, "Seller A cancelling own item should succeed");

      // Check Seller A analytics after cancellation
      const { req: reqAnalytics, res: resAnalytics, getResult: getAnalyticsResult } = createMockReqRes({
        userId: sellerA._id.toString(),
        role: "seller",
      });
      await getSellerAnalytics(reqAnalytics, resAnalytics);
      const { data: analyticsData } = getAnalyticsResult();

      assert.strictEqual(analyticsData.analytics.sellerRevenue, 0, "Cancelled items must be excluded from revenue (expected 0)");
      assert.strictEqual(analyticsData.analytics.totalItemsSold, 0, "Cancelled items must be excluded from items sold (expected 0)");
      assert.strictEqual(analyticsData.analytics.itemStatusCounts.cancelled, 1, "Cancelled item count must be 1");
      console.log("  [PASS] Test 9: Cancelled seller items are excluded from seller revenue");
    }

    // ---------------- TEST 10: Customer shipping address is sanitized on GET /seller/orders ----------------
    {
      const { req, res, getResult } = createMockReqRes({ userId: sellerA._id.toString(), role: "seller" });
      await getSellerOrders(req, res);
      const { data } = getResult();

      const addr = data.orders[0].shippingAddress;
      assert.notStrictEqual(addr, null, "Shipping address object must be present");
      assert.strictEqual(addr.fullName, "John Doe", "Sanitized address contains fullName");
      assert.strictEqual(addr.mobile, "9876543210", "Sanitized address contains mobile");
      assert.strictEqual(addr.city, "New Delhi", "Sanitized address contains city");
      assert.strictEqual(addr.user, undefined, "Sanitized address MUST NOT expose customer user ObjectId reference");
      assert.strictEqual(addr.isDefault, undefined, "Sanitized address MUST NOT expose customer isDefault preference");
      assert.strictEqual(addr.createdAt, undefined, "Sanitized address MUST NOT expose internal DB timestamps");
      console.log("  [PASS] Test 10: Customer shipping address is sanitized (no user ID or private metadata)");
    }

    console.log("\n=================================================");
    console.log("   ALL 10 SELLER ISOLATION TESTS PASSED!         ");
    console.log("=================================================\n");
  } catch (error) {
    console.error("\n[!] TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    // ---------------- CLEANUP ALL TEST DATA ----------------
    if (mixedOrder) await Order.findByIdAndDelete(mixedOrder._id);
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

runTests();
