const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },

    products: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product"
        }
    ]
},
{
    timestamps: true
});

module.exports =
    mongoose.models.Wishlist ||
    mongoose.model("Wishlist", wishlistSchema);