const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },

        quantity: {
          type: Number,
          required: true,
        },

        price: {
          type: Number,
          required: true,
        },

        seller: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          index: true,
        },

        itemStatus: {
          type: String,
          enum: [
            "pending",
            "confirmed",
            "packed",
            "shipped",
            "delivered",
            "cancelled",
          ],
          default: "pending",
        },
      },
    ],

    totalAmount: {
      type: Number,
      required: true,
    },

    couponCode: {
      type: String,
      default: "",
    },

    discount: {
      type: Number,
      default: 0,
    },

    finalAmount: {
      type: Number,
      required: true,
    },

    paymentId: {
      type: String,
      default: "",
      index: true,
    },

    // NEW FIELD
    paymentMethod: {
      type: String,
      enum: ["COD", "ONLINE"],
      default: "COD",
    },

    // NEW FIELD
    paymentStatus: {
      type: String,
      enum: ["Pending", "Paid"],
      default: "Pending",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "packed",
        "pickup scheduled",
        "picked up",
        "in transit",
        "destination hub",
        "out for delivery",
        "delivered",
        "cancelled",
      ],
      default: "pending",
    },

    firstOrderPlaced: {
      type: Boolean,
      default: false,
    },

    shippingAddress: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Address",
      required: true,
    },

    trackingId: {
      type: String,
      default: "",
    },

    courierName: {
      type: String,
      default: "",
    },

    shippingStatus: {
      type: String,
      default: "Not Assigned",
    },

    pickupDate: {
      type: Date,
    },

    deliveryDate: {
      type: Date,
    },
    deliveredAt: {
    type: Date,
    default: null
},
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.models.Order || mongoose.model("Order", orderSchema);