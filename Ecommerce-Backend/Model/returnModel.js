
const mongoose = require("mongoose");

const returnSchema = new mongoose.Schema(

{

    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Order",
        required: true
    },

    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: true
    },

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    reason: {
        type: String,
        required: true
    },

    description: {
        type: String,
        default: ""
    },

    images: [
        {
            url: String,
            publicId: String
        }
    ],

    status: {
        type: String,
        enum: [

            "Pending",

            "Approved",

            "Rejected",

            "Picked",

            "Refunded"

        ],
        default: "Pending"
    },

    refundStatus: {
        type: String,
        enum: [

            "Not Initiated",

            "Processing",

            "Completed"
        ],
        default: "Not Initiated"
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    adminRemark: {
        type: String,
        default: ""
    },
    pickupDate: {
        type: Date,
        default: null
    }
},
{
    timestamps: true
}
);
module.exports = mongoose.model("Return", returnSchema);