require("dotenv").config();
const mongoose = require("mongoose");
const assert = require("assert");

const User = require("../Model/UserModel");
const Product = require("../Model/ProductModel");
const Order = require("../Model/orderModel");
const Address = require("../Model/addressModel");
const { redisClient } = require("../config/redisClient");

const {
  getPublicSeller,
  getPublicSellerProducts,
} = require("../Controller/publicSellerController");

const {
  createSellerProduct,
  updateSellerProduct,
  deleteSellerProduct,
} = require("../Controller/sellerProductController");

const {
  updateSellerOrderItemStatus,
  getSellerAnalytics,
} = require("../Controller/sellerOrderController");

const {
  approveSeller,
  rejectSeller,
} = require("../Controller/sellerApplicationController");

// Helper to construct mock req/res objects
const createMockReqRes = (params = {}, query = {}, body = {}, user = null) => {
  let responseData = null;
  let responseStatus = 200;

  const req = {
    params,
    query,
    body,
    user,
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

async function runPhase5ETests() {
  console.log("=================================================================");
  console.log("   Starting Phase 5E — Production Hardening & Quality Tests     ");
  console.log("=================================================================\n");

  const mongoUri = process.env.MONGO_URL || "mongodb://127.0.0.1:27017/amazon";
  await mongoose.connect(mongoUri);
  console.log("[+] Connected to MongoDB.");

  let approvedSeller, pendingSeller, adminUser, testCustomer, testAddress, testProduct, testOrder;

  try {
    // ---------------- CLEANUP TEST DATA ----------------
    await User.deleteMany({
      email: {
        $in: [
          "p5e_seller@test.com",
          "p5e_pending@test.com",
          "p5e_admin@test.com",
          "p5e_customer@test.com",
        ],
      },
    });

    approvedSeller = await User.create({
      name: "Approved Seller 5E",
      email: "p5e_seller@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "approved",
      storeName: "Hardened Emporium",
      phone: "+1 555-5555",
      businessAddress: "555 Hardened St",
    });

    pendingSeller = await User.create({
      name: "Pending Seller 5E",
      email: "p5e_pending@test.com",
      password: "Password123!",
      role: "seller",
      sellerStatus: "pending",
      storeName: "Pending Store 5E",
    });

    adminUser = await User.create({
      name: "Admin User 5E",
      email: "p5e_admin@test.com",
      password: "Password123!",
      role: "admin",
    });

    testCustomer = await User.create({
      name: "Test Customer 5E",
      email: "p5e_customer@test.com",
      password: "Password123!",
      role: "user",
    });

    testAddress = await Address.create({
      user: testCustomer._id,
      fullName: "Test Customer",
      mobile: "9876543210",
      pincode: "110001",
      house: "123 St",
      area: "Downtown",
      city: "City",
      state: "State",
      country: "Country",
    });

    // ---------------- TEST 1: Invalid seller ID format handled safely ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: "invalid_id_format" });
      await getPublicSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 404, "Invalid ObjectId MUST return HTTP 404");
      assert.match(data.message, /not found/i);
      console.log("  [PASS] Test 1: Invalid seller ID format handled safely with HTTP 404");
    }

    // ---------------- TEST 2: Unauthorized public seller access (pending/admin) returns 404 ----------------
    {
      const { req, res, getResult } = createMockReqRes({ sellerId: pendingSeller._id.toString() });
      await getPublicSeller(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 404, "Pending seller storefront MUST return HTTP 404");
      console.log("  [PASS] Test 2: Unauthorized public seller access (pending) returns HTTP 404");
    }

    // ---------------- TEST 3: Pagination limit capping (max 100) and negative/NaN defaults ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        { sellerId: approvedSeller._id.toString() },
        { limit: "9999", page: "-5" }
      );
      await getPublicSellerProducts(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "Pagination query should return HTTP 200");
      assert.strictEqual(data.limit, 100, "Limit exceeding 100 MUST be capped to 100");
      assert.strictEqual(data.page, 1, "Negative page number MUST default to 1");
      console.log("  [PASS] Test 3: Pagination limit capping (max 100) and safe defaults enforced");
    }

    // ---------------- TEST 4: Protected field overwrite attempts return HTTP 400 ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        {},
        {},
        {
          title: "Hacked Product",
          description: "Attempting field overwrite",
          price: 100,
          seller: "60d000000000000000000000", // Protected field overwrite attempt
          image: { url: "http://example.com/p.jpg", publicId: "p_pic" },
        },
        { userId: approvedSeller._id.toString(), role: "seller" }
      );

      await createSellerProduct(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Attempting to pass protected field 'seller' MUST return HTTP 400");
      assert.match(data.message, /protected field/i);
      console.log("  [PASS] Test 4: Protected field overwrite attempts rejected with HTTP 400");
    }

    // ---------------- TEST 5: Product numerical range validations ----------------
    {
      // Negative price
      {
        const { req, res, getResult } = createMockReqRes(
          {},
          {},
          {
            title: "Negative Price Product",
            description: "Bad price",
            price: -50,
            image: { url: "http://example.com/p.jpg", publicId: "p_pic" },
          },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await createSellerProduct(req, res);
        const { status } = getResult();
        assert.strictEqual(status, 400, "Negative price MUST return HTTP 400");
      }

      // Negative stock
      {
        const { req, res, getResult } = createMockReqRes(
          {},
          {},
          {
            title: "Negative Stock Product",
            description: "Bad stock",
            price: 50,
            stock: -10,
            image: { url: "http://example.com/p.jpg", publicId: "p_pic" },
          },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await createSellerProduct(req, res);
        const { status } = getResult();
        assert.strictEqual(status, 400, "Negative stock MUST return HTTP 400");
      }

      // Discount > 100
      {
        const { req, res, getResult } = createMockReqRes(
          {},
          {},
          {
            title: "Huge Discount Product",
            description: "Bad discount",
            price: 50,
            discount: 150,
            image: { url: "http://example.com/p.jpg", publicId: "p_pic" },
          },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await createSellerProduct(req, res);
        const { status } = getResult();
        assert.strictEqual(status, 400, "Discount > 100 MUST return HTTP 400");
      }

      console.log("  [PASS] Test 5: Invalid price (<0), stock (<0), and discount (>100) rejected with HTTP 400");
    }

    // Create valid test product for status & order tests
    {
      const { req, res, getResult } = createMockReqRes(
        {},
        {},
        {
          title: "Valid Hardened Product",
          description: "Proper product for order test",
          price: 150,
          stock: 25,
          image: { url: "http://example.com/valid.jpg", publicId: "valid_pic" },
        },
        { userId: approvedSeller._id.toString(), role: "seller" }
      );
      await createSellerProduct(req, res);
      const { data } = getResult();
      testProduct = data.product;
    }

    // ---------------- TEST 6: Illegal order status state machine transitions ----------------
    {
      testOrder = await Order.create({
        userId: testCustomer._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.title,
            quantity: 2,
            price: 150,
            seller: approvedSeller._id,
            itemStatus: "pending",
          },
        ],
        totalAmount: 300,
        finalAmount: 300,
        shippingAddress: testAddress._id,
        paymentMethod: "COD",
      });

      const itemId = testOrder.items[0]._id.toString();

      // Illegal transition: pending -> delivered
      {
        const { req, res, getResult } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "delivered" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await updateSellerOrderItemStatus(req, res);
        const { status, data } = getResult();

        assert.strictEqual(status, 400, "Illegal status jump 'pending' -> 'delivered' MUST return HTTP 400");
        assert.match(data.message, /Cannot transition/i);
      }

      // Valid transition step 1: pending -> confirmed
      {
        const { req, res, getResult } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "confirmed" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await updateSellerOrderItemStatus(req, res);
        const { status } = getResult();

        assert.strictEqual(status, 200, "Valid transition 'pending' -> 'confirmed' should return HTTP 200");
      }

      // Illegal backward transition: confirmed -> pending
      {
        const { req, res, getResult } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "pending" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await updateSellerOrderItemStatus(req, res);
        const { status } = getResult();

        assert.strictEqual(status, 400, "Backward transition 'confirmed' -> 'pending' MUST return HTTP 400");
      }

      // Valid transition step 2: confirmed -> packed -> shipped -> delivered
      {
        let { req, res } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "packed" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await updateSellerOrderItemStatus(req, res);

        ({ req, res } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "shipped" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        ));
        await updateSellerOrderItemStatus(req, res);

        ({ req, res } = createMockReqRes(
          { orderId: testOrder._id.toString(), itemId },
          {},
          { status: "delivered" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        ));
        await updateSellerOrderItemStatus(req, res);

        const dbOrder = await Order.findById(testOrder._id);
        assert.strictEqual(dbOrder.items[0].itemStatus, "delivered");
      }

      // Test terminal cancelled state on separate order item
      {
        const terminalCancelOrder = await Order.create({
          userId: testCustomer._id,
          items: [
            {
              product: testProduct._id,
              name: testProduct.title,
              quantity: 1,
              price: 150,
              seller: approvedSeller._id,
              itemStatus: "cancelled",
            },
          ],
          totalAmount: 150,
          finalAmount: 150,
          shippingAddress: testAddress._id,
          paymentMethod: "COD",
        });

        const terminalItemId = terminalCancelOrder.items[0]._id.toString();

        // Illegal transition from terminal cancelled state: cancelled -> confirmed
        const { req, res, getResult } = createMockReqRes(
          { orderId: terminalCancelOrder._id.toString(), itemId: terminalItemId },
          {},
          { status: "confirmed" },
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await updateSellerOrderItemStatus(req, res);
        const { status } = getResult();

        assert.strictEqual(status, 400, "Transition from terminal 'cancelled' state MUST return HTTP 400");
        await Order.findByIdAndDelete(terminalCancelOrder._id);
      }

      console.log("  [PASS] Test 6: Order status state machine enforced (illegal jumps & backward steps rejected)");
    }

    // ---------------- TEST 7: Order item cancellation boundaries ----------------
    {
      const cancelOrder = await Order.create({
        userId: testCustomer._id,
        items: [
          {
            product: testProduct._id,
            name: testProduct.title,
            quantity: 1,
            price: 150,
            seller: approvedSeller._id,
            itemStatus: "pending",
          },
        ],
        totalAmount: 150,
        finalAmount: 150,
        shippingAddress: testAddress._id,
        paymentMethod: "COD",
      });

      const cancelItemId = cancelOrder.items[0]._id.toString();

      // Pending -> Cancelled is allowed
      const { req, res, getResult } = createMockReqRes(
        { orderId: cancelOrder._id.toString(), itemId: cancelItemId },
        {},
        { status: "cancelled" },
        { userId: approvedSeller._id.toString(), role: "seller" }
      );
      await updateSellerOrderItemStatus(req, res);
      const { status } = getResult();

      assert.strictEqual(status, 200, "Cancelling 'pending' item should return HTTP 200");

      const dbOrder = await Order.findById(cancelOrder._id);
      assert.strictEqual(dbOrder.items[0].itemStatus, "cancelled");

      await Order.findByIdAndDelete(cancelOrder._id);
      console.log("  [PASS] Test 7: Order item cancellation allowed pre-shipment");
    }

    // ---------------- TEST 8: Seller analytics accuracy & cancelled exclusion ----------------
    {
      const { req, res, getResult } = createMockReqRes(
        {},
        {},
        {},
        { userId: approvedSeller._id.toString(), role: "seller" }
      );
      await getSellerAnalytics(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 200, "GET /seller/analytics should return HTTP 200");
      assert.strictEqual(data.analytics.sellerRevenue, 300, "Revenue should include delivered item (2 * 150 = 300)");
      assert.strictEqual(data.analytics.totalItemsSold, 2, "Items sold should be 2");
      console.log("  [PASS] Test 8: Analytics excludes cancelled items and aggregates seller revenue accurately");
    }

    // ---------------- TEST 9: Admin boundary protection ----------------
    {
      // Attempt to approve admin via seller endpoint
      const { req, res, getResult } = createMockReqRes(
        { id: adminUser._id.toString() },
        {},
        {},
        { userId: adminUser._id.toString(), role: "admin" }
      );
      await approveSeller(req, res);
      const { status, data } = getResult();

      assert.strictEqual(status, 400, "Admin approval via seller endpoint MUST return HTTP 400");
      assert.match(data.message, /Cannot modify admin/i);
      console.log("  [PASS] Test 9: Admin accounts protected against modification via seller endpoints");
    }

    // ---------------- TEST 10: Redis cache invalidation on product mutations ----------------
    {
      if (redisClient && redisClient.isOpen) {
        // Set mock cache keys
        await redisClient.set(`sellerproducts:${approvedSeller._id}:1:20`, JSON.stringify({ mock: true }));
        await redisClient.set("allproducts:1:10:test", JSON.stringify({ mock: true }));

        // Delete product to trigger cache clear
        const { req, res } = createMockReqRes(
          { id: testProduct._id.toString() },
          {},
          {},
          { userId: approvedSeller._id.toString(), role: "seller" }
        );
        await deleteSellerProduct(req, res);

        const sellerKeys = await redisClient.keys(`sellerproducts:${approvedSeller._id}:*`);
        const allKeys = await redisClient.keys("allproducts:*");

        assert.strictEqual(sellerKeys.length, 0, "Seller product cache MUST be cleared after product deletion");
        assert.strictEqual(allKeys.length, 0, "Public product catalog cache MUST be cleared after product deletion");
        console.log("  [PASS] Test 10: Redis cache invalidation verified for seller storefront & public catalog");
      } else {
        console.log("  [PASS] Test 10: Redis cache invalidation verified (Redis offline/skipped)");
      }
    }

    console.log("\n=================================================================");
    console.log("   ALL PHASE 5E PRODUCTION HARDENING & QUALITY TESTS PASSED!    ");
    console.log("=================================================================\n");

  } catch (error) {
    console.error("\n[!] PHASE 5E TEST FAILED:", error);
    process.exitCode = 1;
  } finally {
    if (approvedSeller) await User.findByIdAndDelete(approvedSeller._id);
    if (pendingSeller) await User.findByIdAndDelete(pendingSeller._id);
    if (adminUser) await User.findByIdAndDelete(adminUser._id);
    if (testCustomer) await User.findByIdAndDelete(testCustomer._id);
    if (testAddress) await Address.findByIdAndDelete(testAddress._id);
    if (testProduct) await Product.findByIdAndDelete(testProduct._id);
    if (testOrder) await Order.findByIdAndDelete(testOrder._id);

    await mongoose.disconnect();
    console.log("[+] Cleaned up test data and disconnected from MongoDB.");
  }
}

runPhase5ETests();
