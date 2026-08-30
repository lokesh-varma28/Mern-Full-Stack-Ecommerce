const Order = require("../Model/orderModel");
const mongoose = require("mongoose");

// Helper to determine active seller ID safely
// For regular sellers: ALWAYS bound strictly to req.user token ID
// For admin: allows explicit sellerId query/body parameter or falls back to token ID
const getSellerIdFromReq = (req) => {
  const tokenUserId = req.user?.userId || req.user?._id || req.user?.id;
  if (req.user?.role === "admin") {
    const explicitSellerId = req.query?.sellerId || req.body?.sellerId || req.params?.sellerId;
    return explicitSellerId || tokenUserId;
  }
  return tokenUserId;
};

// ================= GET SELLER ORDERS =================
// GET /seller/orders
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);

    // DB query filter: find orders containing at least one item belonging to this seller
    const orders = await Order.find({ "items.seller": sellerId })
      .populate({
        path: "items.product",
        select: "title price image category brand",
      })
      .populate({
        path: "shippingAddress",
        select: "fullName mobile house area landmark city state pincode country addressType",
      })
      .sort({ createdAt: -1 });

    // Sanitize order items: filter every order's items array so ONLY this seller's items are returned
    // Sanitize shippingAddress: expose ONLY minimal fulfillment details, never customer user ID or account metadata
    const sellerOrders = orders.map((order) => {
      const orderObj = order.toObject ? order.toObject() : order;

      const sellerItems = (orderObj.items || []).filter(
        (item) => item.seller && item.seller.toString() === sellerId.toString()
      );

      let sanitizedAddress = null;
      if (orderObj.shippingAddress) {
        const addr = orderObj.shippingAddress;
        sanitizedAddress = {
          fullName: addr.fullName || "",
          mobile: addr.mobile || "",
          house: addr.house || "",
          area: addr.area || "",
          landmark: addr.landmark || "",
          city: addr.city || "",
          state: addr.state || "",
          pincode: addr.pincode || "",
          country: addr.country || "India",
        };
      }

      return {
        _id: orderObj._id,
        createdAt: orderObj.createdAt,
        updatedAt: orderObj.updatedAt,
        paymentMethod: orderObj.paymentMethod,
        paymentStatus: orderObj.paymentStatus,
        shippingAddress: sanitizedAddress,
        items: sellerItems,
      };
    });

    return res.status(200).json({
      success: true,
      count: sellerOrders.length,
      orders: sellerOrders,
    });
  } catch (error) {
    console.error("Error fetching seller orders:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller orders",
      error: error.message,
    });
  }
};

// ================= UPDATE SELLER ORDER ITEM STATUS =================
// PUT /seller/orders/:orderId/items/:itemId/status
const updateSellerOrderItemStatus = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);
    const { orderId, itemId } = req.params;
    const { status, itemStatus } = req.body;

    const newStatus = status || itemStatus;
    const allowedStatuses = [
      "pending",
      "confirmed",
      "packed",
      "shipped",
      "delivered",
      "cancelled",
    ];

    if (!newStatus || !allowedStatuses.includes(newStatus)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Allowed statuses are: ${allowedStatuses.join(", ")}`,
      });
    }

    if (!mongoose.Types.ObjectId.isValid(orderId) || !mongoose.Types.ObjectId.isValid(itemId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid Order ID or Item ID format",
      });
    }

    // Strict DB ownership query: Order must contain target item owned by sellerId
    const order = await Order.findOne({
      _id: orderId,
      "items._id": itemId,
      "items.seller": sellerId,
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order item not found or access denied",
      });
    }

    // Locate the specific item within order.items
    const targetItem = order.items.id(itemId);

    if (!targetItem || !targetItem.seller || targetItem.seller.toString() !== sellerId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You do not own this order item.",
      });
    }

    // Define strict status transition state machine rules
    const VALID_TRANSITIONS = {
      pending: ["confirmed", "cancelled"],
      confirmed: ["packed", "cancelled"],
      packed: ["shipped", "cancelled"],
      shipped: ["delivered", "cancelled"],
      delivered: ["cancelled"],
      cancelled: [],
    };

    const currentStatus = (targetItem.itemStatus || "pending").toLowerCase();
    const targetStatus = newStatus.toLowerCase();

    if (currentStatus !== targetStatus) {
      const allowedNext = VALID_TRANSITIONS[currentStatus] || [];
      if (!allowedNext.includes(targetStatus)) {
        return res.status(400).json({
          success: false,
          message: `Cannot transition item status from '${currentStatus}' to '${targetStatus}'. Allowed next status: ${
            allowedNext.length > 0 ? allowedNext.join(", ") : "none (terminal status)"
          }`,
        });
      }
    }

    // Update ONLY itemStatus for the target item
    targetItem.itemStatus = targetStatus;

    await order.save();

    return res.status(200).json({
      success: true,
      message: "Order item status updated successfully",
      updatedItem: targetItem,
    });
  } catch (error) {
    console.error("Error updating seller order item status:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update item status",
      error: error.message,
    });
  }
};

// ================= GET SELLER ANALYTICS =================
// GET /seller/analytics
const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);

    // Fetch orders containing at least one item owned by this seller
    const orders = await Order.find({ "items.seller": sellerId });

    let totalOrders = orders.length;
    let totalItemsSold = 0;
    let sellerRevenue = 0;

    const itemStatusCounts = {
      pending: 0,
      confirmed: 0,
      packed: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
    };

    for (const order of orders) {
      for (const item of order.items) {
        if (item.seller && item.seller.toString() === sellerId.toString()) {
          const statusKey = item.itemStatus || "pending";

          if (itemStatusCounts[statusKey] !== undefined) {
            itemStatusCounts[statusKey] += 1;
          } else {
            itemStatusCounts[statusKey] = 1;
          }

          // Revenue & items sold exclude cancelled items
          if (statusKey !== "cancelled") {
            totalItemsSold += item.quantity || 0;
            sellerRevenue += (item.price || 0) * (item.quantity || 0);
          }
        }
      }
    }

    return res.status(200).json({
      success: true,
      analytics: {
        totalOrders,
        totalItemsSold,
        sellerRevenue,
        itemStatusCounts,
      },
    });
  } catch (error) {
    console.error("Error generating seller analytics:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller analytics",
      error: error.message,
    });
  }
};

// ================= GET SELLER CUSTOMERS =================
// GET /seller/customers
const getSellerCustomers = async (req, res) => {
  try {
    const sellerId = getSellerIdFromReq(req);

    // Find orders containing at least one item owned by this seller
    const orders = await Order.find({ "items.seller": sellerId })
      .populate({
        path: "userId",
        select: "name email",
      })
      .populate({
        path: "items.product",
        select: "title price",
      })
      .populate({
        path: "shippingAddress",
        select: "fullName mobile city state pincode",
      })
      .sort({ createdAt: -1 });

    const customerMap = new Map();

    for (const order of orders) {
      const orderObj = order.toObject ? order.toObject() : order;

      const userKey =
        orderObj.userId?._id?.toString() ||
        orderObj.shippingAddress?.mobile ||
        orderObj.shippingAddress?.fullName ||
        orderObj._id.toString();

      const customerName =
        orderObj.shippingAddress?.fullName || orderObj.userId?.name || "Customer";
      const customerEmail = orderObj.userId?.email || "";
      const customerPhone = orderObj.shippingAddress?.mobile || "";

      if (!customerMap.has(userKey)) {
        customerMap.set(userKey, {
          id: userKey,
          name: customerName,
          email: customerEmail,
          phone: customerPhone,
          orderCount: 0,
          totalSpent: 0,
          productsPurchased: [],
          latestOrderDate: orderObj.createdAt,
          orders: [],
        });
      }

      const cust = customerMap.get(userKey);
      cust.orderCount += 1;

      if (new Date(orderObj.createdAt) > new Date(cust.latestOrderDate)) {
        cust.latestOrderDate = orderObj.createdAt;
      }

      // Process items belonging to this seller
      const sellerItems = (orderObj.items || []).filter(
        (item) => item.seller && item.seller.toString() === sellerId.toString()
      );

      for (const item of sellerItems) {
        if (item.itemStatus !== "cancelled") {
          const itemSubtotal = (item.price || 0) * (item.quantity || 1);
          cust.totalSpent += itemSubtotal;
        }

        const prodTitle = item.product?.title || "Product";
        const existingProd = cust.productsPurchased.find(
          (p) => p.title === prodTitle
        );
        if (existingProd) {
          existingProd.quantity += item.quantity || 1;
        } else {
          cust.productsPurchased.push({
            title: prodTitle,
            quantity: item.quantity || 1,
            price: item.price || 0,
          });
        }
      }

      cust.orders.push({
        orderId: orderObj._id,
        createdAt: orderObj.createdAt,
        paymentStatus: orderObj.paymentStatus,
        itemCount: sellerItems.length,
      });
    }

    const customers = Array.from(customerMap.values());

    return res.status(200).json({
      success: true,
      count: customers.length,
      customers,
    });
  } catch (error) {
    console.error("Error fetching seller customers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch seller customers",
      error: error.message,
    });
  }
};

module.exports = {
  getSellerOrders,
  updateSellerOrderItemStatus,
  getSellerAnalytics,
  getSellerCustomers,
};

